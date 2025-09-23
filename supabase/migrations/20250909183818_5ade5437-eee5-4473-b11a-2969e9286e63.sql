-- Fix the streak calculation logic in update_leaderboard_stats function
-- The recursive approach was overly complex and had bugs
-- Replace with simpler, more reliable approach

CREATE OR REPLACE FUNCTION public.update_leaderboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_challenge_day INTEGER;
BEGIN
  -- Get current challenge day
  SELECT current_day INTO current_challenge_day 
  FROM public.challenge_config 
  WHERE is_active = true 
  LIMIT 1;
  
  -- Ensure all profiles have a leaderboard entry
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
    p.id as user_id,
    p.display_name,
    p.avatar_url,
    0 as total_days_completed,
    0 as streak_current,
    0 as streak_longest,
    0 as overall_progress,
    0 as completion_rate,
    now()
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.leaderboard_stats ls 
    WHERE ls.user_id = p.id
  );
  
  -- Calculate user daily progress and streaks with simpler logic
  WITH user_daily_progress AS (
    SELECT 
      udt.user_id,
      udt.challenge_day,
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE udt.completed = true) as completed_tasks,
      CASE 
        WHEN COUNT(*) = COUNT(*) FILTER (WHERE udt.completed = true) 
        AND COUNT(*) > 0 
        THEN true 
        ELSE false 
      END as day_complete
    FROM public.user_daily_tasks udt
    GROUP BY udt.user_id, udt.challenge_day
  ),
  user_streaks AS (
    SELECT 
      user_id,
      -- Total days completed
      COUNT(challenge_day) FILTER (WHERE day_complete = true) as total_days_completed,
      
      -- Current streak: count consecutive completed days from day 1
      COALESCE((
        SELECT COUNT(*)
        FROM (
          SELECT challenge_day,
                 ROW_NUMBER() OVER (ORDER BY challenge_day) as rn
          FROM user_daily_progress udp2
          WHERE udp2.user_id = udp.user_id 
            AND udp2.day_complete = true
            AND udp2.challenge_day <= current_challenge_day
        ) consecutive
        WHERE consecutive.challenge_day = consecutive.rn
      ), 0) as current_streak,
      
      -- Longest streak: find the longest consecutive sequence
      COALESCE((
        WITH consecutive_groups AS (
          SELECT challenge_day,
                 challenge_day - ROW_NUMBER() OVER (ORDER BY challenge_day) as group_id
          FROM user_daily_progress udp3
          WHERE udp3.user_id = udp.user_id AND udp3.day_complete = true
        )
        SELECT MAX(group_size)
        FROM (
          SELECT COUNT(*) as group_size
          FROM consecutive_groups
          GROUP BY group_id
        ) groups
      ), 0) as longest_streak
    FROM user_daily_progress udp
    GROUP BY user_id
  ),
  comprehensive_progress AS (
    SELECT 
      p.id as user_id,
      COALESCE(
        (
          COALESCE((SELECT COUNT(*) FROM public.user_onboarding_tasks WHERE user_id = p.id AND completed = true), 0) +
          COALESCE((SELECT COUNT(*) FROM public.user_daily_tasks WHERE user_id = p.id AND completed = true), 0) +
          COALESCE((SELECT COUNT(*) FROM public.user_weekly_tasks WHERE user_id = p.id AND completed = true), 0) +
          COALESCE((SELECT COUNT(*) FROM public.user_project_goals WHERE user_id = p.id AND completed = true), 0)
        )::decimal / 421 * 100
      , 0) as overall_progress
    FROM public.profiles p
  )
  UPDATE public.leaderboard_stats ls
  SET 
    display_name = p.display_name,
    avatar_url = p.avatar_url,
    total_days_completed = COALESCE(us.total_days_completed, 0),
    current_streak = COALESCE(us.current_streak, 0),
    longest_streak = GREATEST(COALESCE(us.longest_streak, 0), ls.longest_streak),
    overall_progress = COALESCE(cp.overall_progress, 0),
    completion_rate = ROUND(COALESCE(us.total_days_completed, 0)::decimal / 75::decimal * 100, 1),
    last_updated = now()
  FROM public.profiles p
  LEFT JOIN user_streaks us ON p.id = us.user_id
  LEFT JOIN comprehensive_progress cp ON p.id = cp.user_id
  WHERE ls.user_id = p.id;
    
  -- Assign rank positions ONLY to active participants who opted in to leaderboard
  WITH ranked_users AS (
    SELECT 
      ls.user_id,
      DENSE_RANK() OVER (
        ORDER BY 
          total_days_completed DESC, 
          overall_progress DESC,
          current_streak DESC, 
          longest_streak DESC,
          completion_rate DESC
      ) as new_rank
    FROM public.leaderboard_stats ls
    JOIN public.profiles p ON ls.user_id = p.id
    JOIN public.user_challenge_progress ucp ON ucp.user_id = ls.user_id AND ucp.is_active = true
    WHERE p.show_in_leaderboard = true
  )
  UPDATE public.leaderboard_stats ls
  SET rank_position = ru.new_rank
  FROM ranked_users ru
  WHERE ls.user_id = ru.user_id;
  
  -- Set rank_position to NULL for users who opted out or are not active participants
  UPDATE public.leaderboard_stats ls
  SET rank_position = NULL 
  WHERE NOT EXISTS (
    SELECT 1 
    FROM public.profiles p 
    JOIN public.user_challenge_progress ucp ON ucp.user_id = p.id AND ucp.is_active = true
    WHERE p.id = ls.user_id 
      AND p.show_in_leaderboard = true
  );
  
END;
$function$;