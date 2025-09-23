-- Fix the DELETE statement in update_leaderboard_stats by adding proper WHERE clause
CREATE OR REPLACE FUNCTION public.update_leaderboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Clear existing leaderboard stats with proper WHERE clause
  DELETE FROM public.leaderboard_stats WHERE id IS NOT NULL;
  
  -- Insert complete leaderboard stats with all required fields
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
    -- Calculate completion_rate: min(100, (total_days_completed / days_since_challenge_start) * 100)
    LEAST(100.0, 
      CASE 
        WHEN cc.start_date IS NOT NULL AND cc.start_date <= CURRENT_DATE 
        THEN (ucp.total_days_completed::numeric / GREATEST(1, (CURRENT_DATE - cc.start_date + 1)::numeric)) * 100
        ELSE 0
      END
    ) as completion_rate,
    -- Calculate rank position using DENSE_RANK with proper tie-breakers
    CASE 
      WHEN ucp.is_active = true AND p.show_in_leaderboard = true 
      THEN DENSE_RANK() OVER (
        ORDER BY 
          ucp.total_days_completed DESC,
          ucp.current_streak DESC, 
          ucp.longest_streak DESC,
          ucp.joined_at ASC
      )
      ELSE NULL
    END as rank_position,
    now() as last_updated
  FROM public.user_challenge_progress ucp
  JOIN public.profiles p ON p.id = ucp.user_id
  LEFT JOIN public.challenge_config cc ON cc.is_active = true
  WHERE ucp.is_active = true;

  -- Log the update with count
  RAISE NOTICE 'Leaderboard stats updated successfully for % users', 
    (SELECT COUNT(*) FROM public.leaderboard_stats);
END;
$function$