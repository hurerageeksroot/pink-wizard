-- Fix leaderboard update system: Create parameterless function and fix trigger
-- This resolves the function signature mismatch causing silent failures

-- Create parameterless version that updates all active challenge participants
CREATE OR REPLACE FUNCTION public.update_leaderboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update leaderboard stats for all active challenge participants
  INSERT INTO public.leaderboard_stats (
    user_id,
    display_name,
    avatar_url,
    total_points,
    total_days_completed,
    current_streak,
    longest_streak,
    overall_progress,
    completion_rate,
    rank_position,
    last_updated
  )
  SELECT 
    ucp.user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(upl.points_earned), 0) as total_points,
    ucp.total_days_completed,
    ucp.current_streak,
    ucp.longest_streak,
    ucp.overall_progress,
    CASE 
      WHEN cc.total_days > 0 THEN (ucp.total_days_completed::numeric / cc.total_days::numeric * 100)
      ELSE 0
    END as completion_rate,
    NULL as rank_position,
    now() as last_updated
  FROM public.user_challenge_progress ucp
  JOIN public.profiles p ON p.id = ucp.user_id
  LEFT JOIN public.user_points_ledger upl ON upl.user_id = ucp.user_id
  CROSS JOIN LATERAL (
    SELECT total_days FROM public.challenge_config WHERE is_active = true LIMIT 1
  ) cc
  WHERE ucp.is_active = true
    AND p.show_in_leaderboard = true
  GROUP BY 
    ucp.user_id,
    p.display_name,
    p.avatar_url,
    ucp.total_days_completed,
    ucp.current_streak,
    ucp.longest_streak,
    ucp.overall_progress,
    cc.total_days
  ON CONFLICT (user_id) 
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    total_points = EXCLUDED.total_points,
    total_days_completed = EXCLUDED.total_days_completed,
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    overall_progress = EXCLUDED.overall_progress,
    completion_rate = EXCLUDED.completion_rate,
    last_updated = now();

  -- Update rank positions based on points
  WITH ranked_users AS (
    SELECT 
      user_id,
      DENSE_RANK() OVER (ORDER BY total_points DESC) as new_rank
    FROM public.leaderboard_stats
    WHERE total_points > 0
  )
  UPDATE public.leaderboard_stats ls
  SET rank_position = ru.new_rank
  FROM ranked_users ru
  WHERE ls.user_id = ru.user_id;

  -- Set rank_position to NULL for users with 0 points
  UPDATE public.leaderboard_stats
  SET rank_position = NULL
  WHERE total_points = 0;
END;
$function$;

-- Keep the parameterized version for targeted updates
CREATE OR REPLACE FUNCTION public.update_leaderboard_stats(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update leaderboard stats for specific user
  INSERT INTO public.leaderboard_stats (
    user_id,
    display_name,
    avatar_url,
    total_points,
    total_days_completed,
    current_streak,
    longest_streak,
    overall_progress,
    completion_rate,
    rank_position,
    last_updated
  )
  SELECT 
    ucp.user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(upl.points_earned), 0) as total_points,
    ucp.total_days_completed,
    ucp.current_streak,
    ucp.longest_streak,
    ucp.overall_progress,
    CASE 
      WHEN cc.total_days > 0 THEN (ucp.total_days_completed::numeric / cc.total_days::numeric * 100)
      ELSE 0
    END as completion_rate,
    NULL as rank_position,
    now() as last_updated
  FROM public.user_challenge_progress ucp
  JOIN public.profiles p ON p.id = ucp.user_id
  LEFT JOIN public.user_points_ledger upl ON upl.user_id = ucp.user_id
  CROSS JOIN LATERAL (
    SELECT total_days FROM public.challenge_config WHERE is_active = true LIMIT 1
  ) cc
  WHERE ucp.user_id = user_id_param
    AND ucp.is_active = true
    AND p.show_in_leaderboard = true
  GROUP BY 
    ucp.user_id,
    p.display_name,
    p.avatar_url,
    ucp.total_days_completed,
    ucp.current_streak,
    ucp.longest_streak,
    ucp.overall_progress,
    cc.total_days
  ON CONFLICT (user_id) 
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    total_points = EXCLUDED.total_points,
    total_days_completed = EXCLUDED.total_days_completed,
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    overall_progress = EXCLUDED.overall_progress,
    completion_rate = EXCLUDED.completion_rate,
    last_updated = now();

  -- Recalculate all ranks after update
  WITH ranked_users AS (
    SELECT 
      user_id,
      DENSE_RANK() OVER (ORDER BY total_points DESC) as new_rank
    FROM public.leaderboard_stats
    WHERE total_points > 0
  )
  UPDATE public.leaderboard_stats ls
  SET rank_position = ru.new_rank
  FROM ranked_users ru
  WHERE ls.user_id = ru.user_id;

  UPDATE public.leaderboard_stats
  SET rank_position = NULL
  WHERE total_points = 0;
END;
$function$;

-- Fix the award_activity_points trigger to call parameterless version
CREATE OR REPLACE FUNCTION public.award_activity_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  points_value integer;
  challenge_day_val integer;
BEGIN
  -- Only award points for completed activities
  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get points value based on activity type
  SELECT points INTO points_value
  FROM public.points_values
  WHERE activity_type = NEW.type AND is_active = true
  LIMIT 1;

  -- Default points if not found
  points_value := COALESCE(points_value, 10);

  -- Get current challenge day
  SELECT current_day INTO challenge_day_val
  FROM public.challenge_config
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  challenge_day_val := COALESCE(challenge_day_val, 1);

  -- Insert points record
  INSERT INTO public.user_points_ledger (
    user_id,
    activity_type,
    points_earned,
    description,
    metadata,
    challenge_day,
    created_at
  ) VALUES (
    NEW.user_id,
    NEW.type,
    points_value,
    'Activity completed: ' || NEW.title,
    jsonb_build_object(
      'activity_id', NEW.id,
      'contact_id', NEW.contact_id
    ),
    challenge_day_val,
    now()
  );

  -- Update leaderboard stats using parameterless version
  PERFORM public.update_leaderboard_stats();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in award_activity_points: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Create admin function for manual full recalculation
CREATE OR REPLACE FUNCTION public.admin_refresh_leaderboard()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  updated_count integer;
BEGIN
  -- Only admins can use this
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Get count before update
  SELECT COUNT(*) INTO updated_count
  FROM public.leaderboard_stats;

  -- Run full update
  PERFORM public.update_leaderboard_stats();

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Leaderboard refreshed successfully',
    'users_updated', updated_count,
    'timestamp', now()
  );
END;
$function$;

-- Create health check function
CREATE OR REPLACE FUNCTION public.check_leaderboard_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  stale_count integer;
  discrepancy_count integer;
  oldest_update timestamp with time zone;
  result jsonb;
BEGIN
  -- Check for stale data (not updated in last hour)
  SELECT COUNT(*), MIN(last_updated) 
  INTO stale_count, oldest_update
  FROM public.leaderboard_stats
  WHERE last_updated < now() - interval '1 hour';

  -- Check for point discrepancies
  SELECT COUNT(*) INTO discrepancy_count
  FROM public.leaderboard_stats ls
  LEFT JOIN (
    SELECT user_id, COALESCE(SUM(points_earned), 0) as actual_points
    FROM public.user_points_ledger
    GROUP BY user_id
  ) upl ON upl.user_id = ls.user_id
  WHERE ABS(ls.total_points - COALESCE(upl.actual_points, 0)) > 0;

  result := jsonb_build_object(
    'healthy', (stale_count = 0 AND discrepancy_count = 0),
    'stale_records', stale_count,
    'oldest_update', oldest_update,
    'point_discrepancies', discrepancy_count,
    'checked_at', now()
  );

  RETURN result;
END;
$function$;

-- Run immediate fix for existing discrepancies
DO $$
BEGIN
  PERFORM public.update_leaderboard_stats();
  RAISE NOTICE 'Leaderboard data corrected for all users';
END $$;