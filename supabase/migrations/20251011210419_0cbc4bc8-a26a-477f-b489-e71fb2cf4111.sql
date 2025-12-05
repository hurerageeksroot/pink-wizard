-- Create RPC function to get weekly outreach bonus candidates
CREATE OR REPLACE FUNCTION public.get_weekly_outreach_bonus_candidates()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  weekly_outreach_points numeric,
  already_awarded boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start date;
BEGIN
  -- Only admins can call this
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  week_start := date_trunc('week', current_date)::date;

  RETURN QUERY
  SELECT 
    um.user_id,
    p.display_name,
    SUM(um.value) as weekly_outreach_points,
    EXISTS (
      SELECT 1 FROM user_points_ledger upl
      WHERE upl.user_id = um.user_id
        AND upl.activity_type = 'weekly_outreach_bonus'
        AND DATE(upl.created_at) >= week_start
    ) as already_awarded
  FROM user_metrics um
  JOIN profiles p ON p.id = um.user_id
  WHERE um.metric_name = 'outreach_points'
    AND um.created_at >= week_start
  GROUP BY um.user_id, p.display_name
  HAVING SUM(um.value) >= 500
  ORDER BY weekly_outreach_points DESC;
END;
$$;

-- Create RPC function to get weekly wins bonus candidates
CREATE OR REPLACE FUNCTION public.get_weekly_wins_bonus_candidates()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  weekly_wins bigint,
  already_awarded boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start date;
BEGIN
  -- Only admins can call this
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  week_start := date_trunc('week', current_date)::date;

  RETURN QUERY
  SELECT 
    c.user_id,
    p.display_name,
    COUNT(*) as weekly_wins,
    EXISTS (
      SELECT 1 FROM user_points_ledger upl
      WHERE upl.user_id = c.user_id
        AND upl.activity_type = 'weekly_wins_bonus'
        AND DATE(upl.created_at) >= week_start
    ) as already_awarded
  FROM contacts c
  JOIN profiles p ON p.id = c.user_id
  WHERE c.status = 'won'
    AND c.updated_at >= week_start
  GROUP BY c.user_id, p.display_name
  HAVING COUNT(*) >= 5
  ORDER BY weekly_wins DESC;
END;
$$;

-- Create RPC function to get streak bonus candidates
CREATE OR REPLACE FUNCTION public.get_streak_bonus_candidates()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  current_streak integer,
  eligible_bonus_type text,
  bonus_points integer,
  last_streak_bonus_awarded text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    ls.user_id,
    ls.display_name,
    ls.current_streak,
    CASE 
      WHEN ls.current_streak >= 30 THEN 'streak_bonus_30'
      WHEN ls.current_streak >= 14 THEN 'streak_bonus_14'
      WHEN ls.current_streak >= 7 THEN 'streak_bonus_7'
    END as eligible_bonus_type,
    CASE 
      WHEN ls.current_streak >= 30 THEN 300
      WHEN ls.current_streak >= 14 THEN 150
      WHEN ls.current_streak >= 7 THEN 50
    END as bonus_points,
    (
      SELECT activity_type 
      FROM user_points_ledger 
      WHERE user_id = ls.user_id 
        AND activity_type IN ('streak_bonus_7', 'streak_bonus_14', 'streak_bonus_30')
      ORDER BY 
        CASE activity_type
          WHEN 'streak_bonus_30' THEN 3
          WHEN 'streak_bonus_14' THEN 2
          WHEN 'streak_bonus_7' THEN 1
        END DESC
      LIMIT 1
    ) as last_streak_bonus_awarded
  FROM leaderboard_stats ls
  WHERE ls.current_streak >= 7
  ORDER BY ls.current_streak DESC;
END;
$$;