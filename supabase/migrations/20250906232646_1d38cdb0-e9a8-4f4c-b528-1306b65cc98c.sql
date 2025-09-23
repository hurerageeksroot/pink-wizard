-- Fix the get_my_challenge_goals_and_progress function to calculate revenue correctly
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
  
  -- Calculate current progress
  -- Leads logged (from contacts table)
  SELECT COUNT(*) INTO computed_leads
  FROM public.contacts
  WHERE user_id = uid;
  
  -- Events booked (count contacts with booking_scheduled = true)
  SELECT COUNT(*) INTO computed_events
  FROM public.contacts
  WHERE user_id = uid AND booking_scheduled = true;
  
  -- Revenue (sum from contacts.revenue_amount)
  SELECT COALESCE(SUM(revenue_amount), 0.0) INTO computed_revenue
  FROM public.contacts
  WHERE user_id = uid;
  
  -- Return goals with progress percentages (if goals exist)
  RETURN QUERY
  SELECT 
    g.id as goals_id,
    g.leads_goal,
    g.events_goal,
    g.revenue_goal,
    computed_leads as leads_current,
    computed_events as events_current,
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