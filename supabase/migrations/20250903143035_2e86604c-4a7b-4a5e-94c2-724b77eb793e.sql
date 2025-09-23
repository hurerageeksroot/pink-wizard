-- Create missing RPC functions for gamification system
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id uuid, p_event_type text, p_event_data jsonb DEFAULT '{}')
RETURNS TABLE(awarded_badge_id uuid, badge_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Placeholder implementation - returns no badges for now
  -- This prevents the app from crashing when gamification events are triggered
  RETURN QUERY SELECT NULL::uuid, NULL::text WHERE false;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_variable_reward(p_user_id uuid, p_event_type text, p_context_data jsonb DEFAULT '{}')
RETURNS TABLE(reward_earned boolean, reward_name text, reward_description text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Placeholder implementation - returns no rewards for now
  -- This prevents the app from crashing when reward events are triggered
  RETURN QUERY SELECT false, NULL::text, NULL::text WHERE false;
END;
$$;