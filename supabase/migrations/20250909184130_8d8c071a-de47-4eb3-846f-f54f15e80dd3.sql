-- Fix ambiguous column reference in update_leaderboard_stats function
CREATE OR REPLACE FUNCTION public.update_leaderboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update leaderboard_stats with corrected streak calculations
  INSERT INTO leaderboard_stats (
    user_id,
    total_points,
    total_activities,
    current_streak,
    longest_streak,
    total_days_completed,
    rank_position,
    updated_at
  )
  WITH user_daily_progress AS (
    SELECT DISTINCT
      ucp.user_id,
      dt.day_number,
      CASE 
        WHEN COUNT(dt.id) FILTER (WHERE dt.completed_at IS NOT NULL) > 0 THEN 1
        ELSE 0
      END as day_completed
    FROM user_challenge_progress ucp
    CROSS JOIN daily_tasks dt
    WHERE ucp.is_active = true
      AND dt.user_id = ucp.user_id
      AND dt.challenge_day <= (
        SELECT COALESCE(current_day, 1) 
        FROM challenge_config 
        WHERE is_active = true 
        LIMIT 1
      )
    GROUP BY ucp.user_id, dt.day_number
  ),
  user_stats AS (
    SELECT 
      p.id as user_id,
      COALESCE(points_sum.total_points, 0) as total_points,
      COALESCE(activity_count.total_activities, 0) as total_activities,
      -- Calculate current streak (consecutive days from most recent)
      COALESCE((
        WITH RECURSIVE streak_calc AS (
          -- Start with the most recent day
          SELECT 
            udp.user_id,
            udp.day_number,
            udp.day_completed,
            CASE WHEN udp.day_completed = 1 THEN 1 ELSE 0 END as streak_length
          FROM user_daily_progress udp
          WHERE udp.user_id = p.id
            AND udp.day_number = (
              SELECT MAX(day_number) 
              FROM user_daily_progress 
              WHERE user_id = p.id
            )
          
          UNION ALL
          
          -- Recursively go backwards while days are completed
          SELECT 
            udp.user_id,
            udp.day_number,
            udp.day_completed,
            CASE 
              WHEN udp.day_completed = 1 AND sc.streak_length > 0 
              THEN sc.streak_length + 1 
              ELSE 0 
            END
          FROM user_daily_progress udp
          JOIN streak_calc sc ON udp.user_id = sc.user_id 
            AND udp.day_number = sc.day_number - 1
          WHERE udp.day_completed = 1 AND sc.streak_length > 0
        )
        SELECT COALESCE(MAX(streak_length), 0)
        FROM streak_calc
      ), 0) as current_streak,
      -- Calculate longest streak (maximum consecutive days ever)
      COALESCE((
        WITH streak_groups AS (
          SELECT 
            udp.user_id,
            udp.day_number,
            udp.day_completed,
            udp.day_number - ROW_NUMBER() OVER (
              PARTITION BY udp.user_id 
              ORDER BY udp.day_number
            ) as streak_group
          FROM user_daily_progress udp
          WHERE udp.user_id = p.id AND udp.day_completed = 1
        )
        SELECT COALESCE(MAX(COUNT(*)), 0)
        FROM streak_groups
        GROUP BY user_id, streak_group
      ), 0) as longest_streak,
      -- Total days completed
      COALESCE((
        SELECT COUNT(*)
        FROM user_daily_progress udp
        WHERE udp.user_id = p.id AND udp.day_completed = 1
      ), 0) as user_total_days_completed
    FROM profiles p
    LEFT JOIN (
      SELECT 
        user_id, 
        SUM(points) as total_points
      FROM user_points_ledger 
      GROUP BY user_id
    ) points_sum ON p.id = points_sum.user_id
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as total_activities
      FROM activities
      GROUP BY user_id
    ) activity_count ON p.id = activity_count.user_id
    WHERE EXISTS (
      SELECT 1 FROM user_challenge_progress ucp 
      WHERE ucp.user_id = p.id AND ucp.is_active = true
    )
  )
  SELECT 
    us.user_id,
    us.total_points,
    us.total_activities,
    us.current_streak,
    us.longest_streak,
    us.user_total_days_completed,  -- Use the aliased column name
    ROW_NUMBER() OVER (ORDER BY us.total_points DESC, us.total_activities DESC) as rank_position,
    NOW()
  FROM user_stats us

  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_points = EXCLUDED.total_points,
    total_activities = EXCLUDED.total_activities,
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    total_days_completed = EXCLUDED.total_days_completed,
    rank_position = EXCLUDED.rank_position,
    updated_at = EXCLUDED.updated_at;
END;
$$;