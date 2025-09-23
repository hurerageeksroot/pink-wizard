
-- 1) Restrict Points Leaderboard to participants and challenge window,
--    but allow pre-start onboarding points to count toward the challenge.

CREATE OR REPLACE FUNCTION public.get_points_leaderboard()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  total_points bigint,
  total_activities bigint,
  rank_position bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH active_challenge AS (
    SELECT start_date, end_date
    FROM public.challenge_config
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1
  ),
  participants AS (
    SELECT ucp.user_id
    FROM public.user_challenge_progress ucp
    WHERE ucp.is_active = true
  )
  SELECT 
    p.id AS user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(upl.points_earned), 0) AS total_points,
    COUNT(upl.id) AS total_activities,
    DENSE_RANK() OVER (ORDER BY COALESCE(SUM(upl.points_earned), 0) DESC) AS rank_position
  FROM public.profiles p
  JOIN participants part ON part.user_id = p.id
  LEFT JOIN public.user_points_ledger upl
    ON upl.user_id = p.id
    AND EXISTS (SELECT 1 FROM active_challenge)
    AND (
      upl.created_at::date BETWEEN (SELECT start_date FROM active_challenge) AND (SELECT end_date FROM active_challenge)
      OR (upl.activity_type = 'onboarding_task_completed' AND upl.created_at::date < (SELECT start_date FROM active_challenge))
    )
  WHERE p.show_in_leaderboard = true
  GROUP BY p.id, p.display_name, p.avatar_url
  ORDER BY total_points DESC;
$function$;

-- 2) Restrict Revenue Leaderboard to participants and challenge window (no pre-start revenue).

CREATE OR REPLACE FUNCTION public.get_revenue_leaderboard()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  total_revenue numeric,
  won_deals bigint,
  total_contacts bigint,
  rank_position bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH active_challenge AS (
    SELECT start_date, end_date
    FROM public.challenge_config
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1
  ),
  participants AS (
    SELECT ucp.user_id
    FROM public.user_challenge_progress ucp
    WHERE ucp.is_active = true
  )
  SELECT
    p.id AS user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(c.revenue_amount), 0) AS total_revenue,
    COUNT(c.id) FILTER (WHERE c.status = 'won') AS won_deals,
    COUNT(c.id) AS total_contacts,
    DENSE_RANK() OVER (ORDER BY COALESCE(SUM(c.revenue_amount), 0) DESC) AS rank_position
  FROM public.profiles p
  JOIN participants part ON part.user_id = p.id
  LEFT JOIN public.contacts c
    ON c.user_id = p.id
    AND c.status = 'won'
    AND EXISTS (SELECT 1 FROM active_challenge)
    AND c.updated_at::date BETWEEN (SELECT start_date FROM active_challenge) AND (SELECT end_date FROM active_challenge)
  WHERE p.show_in_leaderboard = true
  GROUP BY p.id, p.display_name, p.avatar_url
  ORDER BY total_revenue DESC;
$function$;

-- 3) Limit challenge rank positions to active participants in update_leaderboard_stats.
--    (Keep all existing stats logic; only adjust the ranked_users set.)

CREATE OR REPLACE FUNCTION public.update_leaderboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  -- Aggregate user daily progress
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
      COUNT(DISTINCT challenge_day) FILTER (WHERE day_complete = true) as total_days_completed,
      COALESCE((
        WITH RECURSIVE streak_calc AS (
          SELECT 
            user_id,
            challenge_day,
            day_complete,
            CASE WHEN day_complete THEN 1 ELSE 0 END as streak_count,
            challenge_day as max_day
          FROM user_daily_progress udp1
          WHERE udp1.user_id = udp.user_id 
          AND udp1.challenge_day = (
            SELECT MAX(challenge_day) 
            FROM user_daily_progress udp2 
            WHERE udp2.user_id = udp1.user_id
          )
          
          UNION ALL
          
          SELECT 
            udp.user_id,
            udp.challenge_day,
            udp.day_complete,
            CASE 
              WHEN udp.day_complete AND sc.streak_count > 0 THEN sc.streak_count + 1
              ELSE 0 
            END,
            sc.max_day
          FROM user_daily_progress udp
          JOIN streak_calc sc ON udp.user_id = sc.user_id 
          WHERE udp.challenge_day = sc.challenge_day - 1
          AND sc.streak_count > 0
        )
        SELECT COALESCE(MAX(streak_count), 0)
        FROM streak_calc
      ), 0) as streak_current,
      COALESCE((
        WITH streak_groups AS (
          SELECT 
            user_id,
            challenge_day,
            challenge_day - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY challenge_day) as grp
          FROM user_daily_progress
          WHERE user_id = udp.user_id AND day_complete = true
        )
        SELECT COALESCE(MAX(cnt), 0)
        FROM (
          SELECT COUNT(*) as cnt
          FROM streak_groups
          GROUP BY user_id, grp
        ) streak_counts
      ), 0) as streak_longest
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
          COALESCE((SELECT COUNT(*) FROM public.user_weekly_goals WHERE user_id = p.id AND completed = true), 0) +
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
    current_streak = COALESCE(us.streak_current, 0),
    longest_streak = GREATEST(COALESCE(us.streak_longest, 0), ls.longest_streak),
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
