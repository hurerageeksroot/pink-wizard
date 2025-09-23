-- Fix the leaderboard stats function to avoid DELETE without WHERE clause
CREATE OR REPLACE FUNCTION public.update_leaderboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use TRUNCATE instead of DELETE to clear all rows efficiently
  TRUNCATE public.leaderboard_stats;
  
  -- Populate leaderboard_stats directly from user_challenge_progress with proper ranking
  INSERT INTO public.leaderboard_stats (
    user_id,
    display_name,
    avatar_url,
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
    ucp.total_days_completed,
    ucp.current_streak,
    ucp.longest_streak,
    ucp.overall_progress,
    -- Calculate completion rate based on days since challenge start
    CASE 
      WHEN cc.start_date IS NOT NULL THEN
        LEAST(100.0, (ucp.total_days_completed::numeric / GREATEST(1, (CURRENT_DATE - cc.start_date + 1))) * 100.0)
      ELSE 0.0
    END as completion_rate,
    -- Proper ranking with tie-breaking: days completed, current streak, longest streak, join date
    DENSE_RANK() OVER (
      ORDER BY 
        ucp.total_days_completed DESC,
        ucp.current_streak DESC, 
        ucp.longest_streak DESC,
        ucp.joined_at ASC
    ) as rank_position,
    NOW() as last_updated
  FROM public.user_challenge_progress ucp
  JOIN public.profiles p ON p.id = ucp.user_id
  LEFT JOIN public.challenge_config cc ON cc.is_active = true
  WHERE ucp.is_active = true
    AND p.show_in_leaderboard = true
  ORDER BY 
    ucp.total_days_completed DESC,
    ucp.current_streak DESC,
    ucp.longest_streak DESC,
    ucp.joined_at ASC;
END;
$$;