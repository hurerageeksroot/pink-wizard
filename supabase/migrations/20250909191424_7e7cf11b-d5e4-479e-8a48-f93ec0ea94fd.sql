-- Fix the update_leaderboard_stats function to properly update all leaderboard stats columns
CREATE OR REPLACE FUNCTION public.update_leaderboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update leaderboard stats for all active challenge participants
  INSERT INTO public.leaderboard_stats (
    user_id,
    display_name,
    avatar_url,
    total_days_completed,
    current_streak,
    longest_streak,
    overall_progress,
    completion_rate,
    last_updated
  )
  SELECT 
    ucp.user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(ucp.total_days_completed, 0) as total_days_completed,
    COALESCE(ucp.current_streak, 0) as current_streak,
    COALESCE(ucp.longest_streak, 0) as longest_streak,
    COALESCE(ucp.overall_progress, 0) as overall_progress,
    CASE 
      WHEN COALESCE(ucp.total_days_completed, 0) > 0 THEN 
        ROUND((COALESCE(ucp.overall_progress, 0) / 100.0) * 100, 2)
      ELSE 0 
    END as completion_rate,
    now() as last_updated
  FROM public.user_challenge_progress ucp
  LEFT JOIN public.profiles p ON p.id = ucp.user_id
  WHERE ucp.is_active = true
  ON CONFLICT (user_id) 
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    total_days_completed = EXCLUDED.total_days_completed,
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    overall_progress = EXCLUDED.overall_progress,
    completion_rate = EXCLUDED.completion_rate,
    last_updated = EXCLUDED.last_updated;
    
  -- Log the update
  RAISE NOTICE 'Leaderboard stats updated successfully for % participants', 
    (SELECT COUNT(*) FROM public.user_challenge_progress WHERE is_active = true);
END;
$function$