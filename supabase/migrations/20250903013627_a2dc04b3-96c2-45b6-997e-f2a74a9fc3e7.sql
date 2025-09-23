
-- 1) AI tier quotas (editable only by admins), read allowed to authenticated users
CREATE TABLE IF NOT EXISTS public.ai_tier_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL UNIQUE, -- e.g., 'Free' | 'Basic' | 'Premium' | 'Enterprise'
  monthly_token_quota INTEGER NOT NULL DEFAULT 0,
  per_request_token_limit INTEGER NOT NULL DEFAULT 1000,
  overage_allowed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_tier_quotas ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view quotas (not sensitive; useful for UI)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ai_tier_quotas' AND policyname = 'Anyone authenticated can view AI tier quotas'
  ) THEN
    CREATE POLICY "Anyone authenticated can view AI tier quotas"
    ON public.ai_tier_quotas
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);
  END IF;
END$$;

-- Admins manage quotas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ai_tier_quotas' AND policyname = 'Admins can manage AI tier quotas'
  ) THEN
    CREATE POLICY "Admins can manage AI tier quotas"
    ON public.ai_tier_quotas
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END$$;

-- Seed sensible defaults (idempotent)
INSERT INTO public.ai_tier_quotas (tier, monthly_token_quota, per_request_token_limit, overage_allowed)
VALUES
  ('Free', 10000, 1500, false),
  ('Basic', 100000, 4000, false),
  ('Premium', 300000, 8000, false),
  ('Enterprise', 1000000, 16000, true)
ON CONFLICT (tier) DO UPDATE
SET 
  monthly_token_quota = EXCLUDED.monthly_token_quota,
  per_request_token_limit = EXCLUDED.per_request_token_limit,
  overage_allowed = EXCLUDED.overage_allowed,
  updated_at = now();

-- 2) Monthly usage per user (writes by service role, reads by owner)
CREATE TABLE IF NOT EXISTS public.ai_usage_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,          -- do not FK to auth.users per best practice
  period_start DATE NOT NULL,     -- first day of the month
  tokens_used INTEGER NOT NULL DEFAULT 0,
  requests_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);

ALTER TABLE public.ai_usage_monthly ENABLE ROW LEVEL SECURITY;

-- Users can read their own monthly usage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ai_usage_monthly' AND policyname = 'Users can view their own monthly AI usage'
  ) THEN
    CREATE POLICY "Users can view their own monthly AI usage"
    ON public.ai_usage_monthly
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END$$;

-- service role can manage usage records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ai_usage_monthly' AND policyname = 'service_role manage ai_usage_monthly'
  ) THEN
    CREATE POLICY "service_role manage ai_usage_monthly"
    ON public.ai_usage_monthly
    FOR ALL
    TO authenticated
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_ai_usage_monthly_user_period
  ON public.ai_usage_monthly (user_id, period_start);

-- 3) AI credits (token packs). Writes by service role (edge/checkout), reads by owner
CREATE TABLE IF NOT EXISTS public.ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tokens_total INTEGER NOT NULL,
  tokens_remaining INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',    -- 'active' | 'consumed' | 'refunded' | 'expired'
  source TEXT,                               -- e.g., Stripe session id or description
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits (non-sensitive balances)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ai_credits' AND policyname = 'Users can view their own AI credits'
  ) THEN
    CREATE POLICY "Users can view their own AI credits"
    ON public.ai_credits
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END$$;

-- service role manages credits (insert/update from edge functions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ai_credits' AND policyname = 'service_role manage ai_credits'
  ) THEN
    CREATE POLICY "service_role manage ai_credits"
    ON public.ai_credits
    FOR ALL
    TO authenticated
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_ai_credits_user_status
  ON public.ai_credits (user_id, status);

-- 4) Request-level log (minimal metadata). Writes by service role, reads by owner
CREATE TABLE IF NOT EXISTS public.ai_requests_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  model TEXT,
  tokens_prompt INTEGER DEFAULT 0,
  tokens_completion INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_code TEXT,
  request_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_requests_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own request logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ai_requests_log' AND policyname = 'Users can view their own AI request logs'
  ) THEN
    CREATE POLICY "Users can view their own AI request logs"
    ON public.ai_requests_log
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END$$;

-- service role manages request logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ai_requests_log' AND policyname = 'service_role manage ai_requests_log'
  ) THEN
    CREATE POLICY "service_role manage ai_requests_log"
    ON public.ai_requests_log
    FOR ALL
    TO authenticated
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_ai_requests_log_user_created
  ON public.ai_requests_log (user_id, created_at);

-- 5) Helper function to compute effective quota for current user
CREATE OR REPLACE FUNCTION public.get_my_ai_quota()
RETURNS TABLE(
  tier TEXT,
  monthly_quota INTEGER,
  monthly_used INTEGER,
  credits_remaining INTEGER,
  per_request_limit INTEGER,
  remaining INTEGER,
  period_start DATE,
  period_end DATE
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_period_start DATE;
  v_tier TEXT := 'Free';
  v_monthly_quota INTEGER := 10000;
  v_per_request_limit INTEGER := 1500;
  v_monthly_used INTEGER := 0;
  v_credits_remaining INTEGER := 0;
  v_subscribed BOOLEAN := false;
  v_sub_tier TEXT;
  v_period_end DATE;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO v_user_id;
  IF v_user_id IS NULL THEN
    -- Not authenticated; return zeros with Free tier defaults
    v_period_start := date_trunc('month', now())::date;
    v_period_end := (date_trunc('month', now()) + INTERVAL '1 month - 1 day')::date;
    RETURN QUERY SELECT v_tier, v_monthly_quota, 0, 0, v_per_request_limit, v_monthly_quota, v_period_start, v_period_end;
    RETURN;
  END IF;

  v_period_start := date_trunc('month', now())::date;
  v_period_end := (date_trunc('month', now()) + INTERVAL '1 month - 1 day')::date;

  -- Determine subscription tier if present
  SELECT s.subscribed, s.subscription_tier
  INTO v_subscribed, v_sub_tier
  FROM public.subscribers s
  WHERE s.user_id = v_user_id
  ORDER BY s.updated_at DESC
  LIMIT 1;

  IF COALESCE(v_subscribed, false) AND v_sub_tier IS NOT NULL THEN
    v_tier := v_sub_tier; -- Expected values: 'Basic' | 'Premium' | 'Enterprise'
  ELSE
    v_tier := 'Free';
  END IF;

  -- Load tier quotas if configured
  SELECT 
    atq.monthly_token_quota, 
    atq.per_request_token_limit
  INTO 
    v_monthly_quota, 
    v_per_request_limit
  FROM public.ai_tier_quotas atq
  WHERE atq.tier = v_tier
  LIMIT 1;

  -- Fallbacks if no matching row
  v_monthly_quota := COALESCE(v_monthly_quota, 10000);
  v_per_request_limit := COALESCE(v_per_request_limit, 1500);

  -- Current monthly usage
  SELECT tokens_used INTO v_monthly_used
  FROM public.ai_usage_monthly
  WHERE user_id = v_user_id AND period_start = v_period_start
  LIMIT 1;

  v_monthly_used := COALESCE(v_monthly_used, 0);

  -- Active credits
  SELECT COALESCE(SUM(tokens_remaining), 0) INTO v_credits_remaining
  FROM public.ai_credits
  WHERE user_id = v_user_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now());

  RETURN QUERY SELECT 
    v_tier,
    v_monthly_quota,
    v_monthly_used,
    v_credits_remaining,
    v_per_request_limit,
    GREATEST(v_monthly_quota - v_monthly_used, 0) + v_credits_remaining,
    v_period_start,
    v_period_end;
END;
$$;
