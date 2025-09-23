-- Fix the handle_new_user trigger that's missing
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR each ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create missing RPC functions for gamification
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id uuid, p_event_type text, p_event_data jsonb DEFAULT '{}')
RETURNS TABLE(awarded_badge_id uuid, badge_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Placeholder implementation - returns no badges for now
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
  RETURN QUERY SELECT false, NULL::text, NULL::text WHERE false;
END;
$$;