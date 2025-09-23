-- Create user challenge goals table
CREATE TABLE public.user_challenge_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  leads_goal INTEGER NOT NULL DEFAULT 0,
  events_goal INTEGER NOT NULL DEFAULT 0,
  revenue_goal NUMERIC NOT NULL DEFAULT 0,
  leads_current INTEGER NOT NULL DEFAULT 0,
  events_current INTEGER NOT NULL DEFAULT 0,
  revenue_current NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_challenge_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own challenge goals" 
ON public.user_challenge_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own challenge goals" 
ON public.user_challenge_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge goals" 
ON public.user_challenge_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all challenge goals" 
ON public.user_challenge_goals 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Function to get goals and current progress
CREATE OR REPLACE FUNCTION public.get_my_challenge_goals_and_progress()
RETURNS TABLE(
  goals_id uuid,
  leads_goal integer,
  events_goal integer,
  revenue_goal numeric,
  leads_current integer,
  events_current integer,
  revenue_current numeric,
  leads_progress numeric,
  events_progress numeric,
  revenue_progress numeric,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  computed_leads integer := 0;
  computed_events integer := 0;
  computed_revenue numeric := 0.0;
BEGIN
  SELECT auth.uid() INTO uid;
  
  IF uid IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate current progress from user_metrics and contacts
  -- Leads logged (from contacts table)
  SELECT COUNT(*) INTO computed_leads
  FROM public.contacts
  WHERE user_id = uid;
  
  -- Events booked (from user_metrics where metric_name = 'events_booked')
  SELECT COALESCE(SUM(value), 0) INTO computed_events
  FROM public.user_metrics
  WHERE user_id = uid AND metric_name = 'events_booked';
  
  -- Revenue (from user_metrics where metric_name = 'event_value' and metric_type = 'currency')
  SELECT COALESCE(SUM(value), 0.0) INTO computed_revenue
  FROM public.user_metrics
  WHERE user_id = uid AND metric_name = 'event_value' AND metric_type = 'currency';
  
  -- Update current values in goals table
  UPDATE public.user_challenge_goals
  SET 
    leads_current = computed_leads,
    events_current = computed_events::integer,
    revenue_current = computed_revenue,
    updated_at = now()
  WHERE user_id = uid;
  
  -- Return goals with progress percentages
  RETURN QUERY
  SELECT 
    g.id as goals_id,
    g.leads_goal,
    g.events_goal,
    g.revenue_goal,
    computed_leads as leads_current,
    computed_events::integer as events_current,
    computed_revenue as revenue_current,
    CASE 
      WHEN g.leads_goal > 0 THEN ROUND((computed_leads::numeric / g.leads_goal::numeric) * 100, 1)
      ELSE 0::numeric
    END as leads_progress,
    CASE 
      WHEN g.events_goal > 0 THEN ROUND((computed_events::numeric / g.events_goal::numeric) * 100, 1)
      ELSE 0::numeric
    END as events_progress,
    CASE 
      WHEN g.revenue_goal > 0 THEN ROUND((computed_revenue / g.revenue_goal) * 100, 1)
      ELSE 0::numeric
    END as revenue_progress,
    g.created_at,
    g.updated_at
  FROM public.user_challenge_goals g
  WHERE g.user_id = uid;
END;
$$;

-- Admin function to bulk import goals by email
CREATE OR REPLACE FUNCTION public.upsert_challenge_goals_by_email(
  p_email text,
  p_leads_goal integer,
  p_events_goal integer, 
  p_revenue_goal numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  result jsonb;
BEGIN
  -- Only admins can use this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Find user by email
  SELECT p.id INTO target_user_id
  FROM public.profiles p
  WHERE lower(trim(p.email)) = lower(trim(p_email));
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found with email: ' || p_email
    );
  END IF;
  
  -- Upsert goals
  INSERT INTO public.user_challenge_goals (
    user_id, leads_goal, events_goal, revenue_goal
  ) VALUES (
    target_user_id, p_leads_goal, p_events_goal, p_revenue_goal
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    leads_goal = EXCLUDED.leads_goal,
    events_goal = EXCLUDED.events_goal,
    revenue_goal = EXCLUDED.revenue_goal,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'email', p_email,
    'goals_set', jsonb_build_object(
      'leads', p_leads_goal,
      'events', p_events_goal,
      'revenue', p_revenue_goal
    )
  );
END;
$$;