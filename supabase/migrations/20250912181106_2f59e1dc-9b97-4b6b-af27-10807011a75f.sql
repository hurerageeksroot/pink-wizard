-- Fix remaining functions with mutable search_path security issues
-- Query to find functions without SET search_path
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND routine_definition NOT LIKE '%SET search_path%';

-- Update all remaining critical functions to have secure search_path
CREATE OR REPLACE FUNCTION public.update_leaderboard_stats(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_points bigint;
  user_activities bigint;
  current_streak_days integer;
  longest_streak_days integer;
BEGIN
  -- Calculate total points for user
  SELECT COALESCE(SUM(points_earned), 0) INTO user_points
  FROM public.user_points_ledger
  WHERE user_id = user_id_param;

  -- Calculate total activities
  SELECT COUNT(*) INTO user_activities
  FROM public.activities
  WHERE user_id = user_id_param;

  -- Calculate current and longest streak (simplified version)
  -- This could be enhanced with more complex streak logic
  current_streak_days := 0;  -- Placeholder
  longest_streak_days := 0;  -- Placeholder

  -- Upsert leaderboard stats
  INSERT INTO public.leaderboard_stats (
    user_id, total_points, total_activities, current_streak, longest_streak, updated_at
  ) VALUES (
    user_id_param, user_points, user_activities, current_streak_days, longest_streak_days, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = EXCLUDED.total_points,
    total_activities = EXCLUDED.total_activities,
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- Fix other commonly used functions
CREATE OR REPLACE FUNCTION public.get_current_challenge_day()
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  challenge_start_date date;
  current_day integer;
BEGIN
  SELECT start_date, current_day INTO challenge_start_date, current_day
  FROM public.challenge_config 
  WHERE is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  RETURN COALESCE(current_day, 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.user_can_write_secure(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN public.user_can_write(user_id_param);
END;
$$;