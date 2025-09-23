
-- 1) Status enum for reward requests
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reward_request_status') THEN
    CREATE TYPE public.reward_request_status AS ENUM ('pending','approved','shipped','rejected','cancelled');
  END IF;
END
$$;

-- 2) Guaranteed rewards (milestones) definition table
CREATE TABLE IF NOT EXISTS public.guaranteed_rewards_definition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  -- metric_key allows flexible trigger sources without code changes (documented keys):
  -- 'total_revenue', 'contacts_won', 'contacts_added', 'outreach_actions'
  metric_key TEXT NOT NULL,
  threshold NUMERIC NOT NULL CHECK (threshold >= 0),
  reward_name TEXT NOT NULL,
  reward_description TEXT,
  reward_image_url TEXT,
  shipping_required BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guaranteed_rewards_definition ENABLE ROW LEVEL SECURITY;

-- Admins can manage milestone definitions
CREATE POLICY IF NOT EXISTS "Admins manage guaranteed reward definitions"
  ON public.guaranteed_rewards_definition
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Authenticated users can view active milestone definitions
CREATE POLICY IF NOT EXISTS "Users view active guaranteed reward definitions"
  ON public.guaranteed_rewards_definition
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 3) Awarded milestones per user
CREATE TABLE IF NOT EXISTS public.user_guaranteed_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  definition_id UUID NOT NULL REFERENCES public.guaranteed_rewards_definition(id) ON DELETE CASCADE,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  context_data JSONB DEFAULT '{}'::jsonb,
  UNIQUE (user_id, definition_id)
);

ALTER TABLE public.user_guaranteed_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own awarded milestones
CREATE POLICY IF NOT EXISTS "Users view own user_guaranteed_rewards"
  ON public.user_guaranteed_rewards
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage awarded milestones
CREATE POLICY IF NOT EXISTS "Admins manage user_guaranteed_rewards"
  ON public.user_guaranteed_rewards
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Note: No user insert/update policies; awards are created via SECURITY DEFINER function below

-- 4) Shipping requests (user fills a form to request their physical reward)
CREATE TABLE IF NOT EXISTS public.reward_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  definition_id UUID NOT NULL REFERENCES public.guaranteed_rewards_definition(id) ON DELETE CASCADE,
  -- Optionally link to an awarded record for traceability (not required for the RLS check)
  user_reward_id UUID NULL REFERENCES public.user_guaranteed_rewards(id) ON DELETE SET NULL,

  status public.reward_request_status NOT NULL DEFAULT 'pending',

  shipping_full_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  phone TEXT,
  notes TEXT,

  -- Admin fulfillment fields
  tracking_number TEXT,
  carrier TEXT,
  admin_notes TEXT,
  fulfilled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure one request per user per reward
  UNIQUE (user_id, definition_id)
);

ALTER TABLE public.reward_requests ENABLE ROW LEVEL SECURITY;

-- Users can create a request for a reward they have earned (and only once)
CREATE POLICY IF NOT EXISTS "Users insert own reward_requests for earned milestones"
  ON public.reward_requests
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.user_guaranteed_rewards ugr
      WHERE ugr.user_id = auth.uid()
        AND ugr.definition_id = reward_requests.definition_id
    )
  );

-- Users can view their own requests
CREATE POLICY IF NOT EXISTS "Users view own reward_requests"
  ON public.reward_requests
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own request only while it's pending (to fix address, etc.)
CREATE POLICY IF NOT EXISTS "Users update own pending reward_requests"
  ON public.reward_requests
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins can manage all reward requests
CREATE POLICY IF NOT EXISTS "Admins manage all reward_requests"
  ON public.reward_requests
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_guaranteed_rewards_user ON public.user_guaranteed_rewards (user_id);
CREATE INDEX IF NOT EXISTS idx_reward_requests_user ON public.reward_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_reward_requests_status ON public.reward_requests (status);
CREATE INDEX IF NOT EXISTS idx_guaranteed_rewards_definition_active ON public.guaranteed_rewards_definition (is_active, sort_order);

-- 5) Server-side function to award guaranteed rewards based on thresholds
CREATE OR REPLACE FUNCTION public.check_and_award_guaranteed_rewards(
  p_user_id uuid,
  p_event_type text,
  p_event_data jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(awarded_definition_id uuid, reward_name text) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  def_rec RECORD;
  already_awarded BOOLEAN;
  -- Precomputed metrics
  m_total_revenue NUMERIC := 0;
  m_contacts_won INTEGER := 0;
  m_contacts_added INTEGER := 0;
  m_outreach_actions INTEGER := 0;
BEGIN
  -- Precompute the key metrics for the user

  -- Total revenue from user_metrics where metric_name = 'event_value'
  SELECT COALESCE(SUM(value), 0) INTO m_total_revenue
  FROM public.user_metrics
  WHERE user_id = p_user_id
    AND metric_name = 'event_value';

  -- Contacts won
  SELECT COUNT(*) INTO m_contacts_won
  FROM public.contacts
  WHERE user_id = p_user_id
    AND status = 'won';

  -- Contacts added
  SELECT COUNT(*) INTO m_contacts_added
  FROM public.contacts
  WHERE user_id = p_user_id;

  -- Outreach actions (count of activities)
  SELECT COUNT(*) INTO m_outreach_actions
  FROM public.activities
  WHERE user_id = p_user_id;

  -- Evaluate all active definitions not yet awarded to this user
  FOR def_rec IN
    SELECT grd.*
    FROM public.guaranteed_rewards_definition grd
    WHERE grd.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.user_guaranteed_rewards ugr
        WHERE ugr.user_id = p_user_id
          AND ugr.definition_id = grd.id
      )
    ORDER BY grd.sort_order, grd.threshold
  LOOP
    -- Determine the user's current value for this metric
    PERFORM 1; -- placeholder
    CASE def_rec.metric_key
      WHEN 'total_revenue' THEN
        IF m_total_revenue >= def_rec.threshold THEN
          INSERT INTO public.user_guaranteed_rewards (user_id, definition_id, context_data)
          VALUES (p_user_id, def_rec.id, jsonb_build_object('metric', 'total_revenue', 'value', m_total_revenue))
          ON CONFLICT DO NOTHING;

          RETURN QUERY SELECT def_rec.id, def_rec.reward_name;
        END IF;

      WHEN 'contacts_won' THEN
        IF m_contacts_won >= def_rec.threshold THEN
          INSERT INTO public.user_guaranteed_rewards (user_id, definition_id, context_data)
          VALUES (p_user_id, def_rec.id, jsonb_build_object('metric', 'contacts_won', 'value', m_contacts_won))
          ON CONFLICT DO NOTHING;

          RETURN QUERY SELECT def_rec.id, def_rec.reward_name;
        END IF;

      WHEN 'contacts_added' THEN
        IF m_contacts_added >= def_rec.threshold THEN
          INSERT INTO public.user_guaranteed_rewards (user_id, def_rec.id, context_data)
          VALUES (p_user_id, def_rec.id, jsonb_build_object('metric', 'contacts_added', 'value', m_contacts_added))
          ON CONFLICT DO NOTHING;

          RETURN QUERY SELECT def_rec.id, def_rec.reward_name;
        END IF;

      WHEN 'outreach_actions' THEN
        IF m_outreach_actions >= def_rec.threshold THEN
          INSERT INTO public.user_guaranteed_rewards (user_id, definition_id, context_data)
          VALUES (p_user_id, def_rec.id, jsonb_build_object('metric', 'outreach_actions', 'value', m_outreach_actions))
          ON CONFLICT DO NOTHING;

          RETURN QUERY SELECT def_rec.id, def_rec.reward_name;
        END IF;

      ELSE
        -- Unknown metric_key; skip silently (keeps flexibility)
        CONTINUE;
    END CASE;
  END LOOP;

END;
$function$;
