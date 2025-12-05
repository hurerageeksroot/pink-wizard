-- Fix the ambiguous award_points function call in check_performance_bonuses
-- This will allow the retroactive points restoration to work

CREATE OR REPLACE FUNCTION public.check_performance_bonuses(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  week_start date;
  week_outreach_points numeric;
  week_wins integer;
  user_current_streak integer;
  last_bonus_week date;
BEGIN
  -- Get current week start (Monday)
  week_start := date_trunc('week', current_date)::date;
  
  -- Check if we already awarded bonuses for this week
  SELECT COALESCE(MAX(DATE(created_at)), '1970-01-01'::date) INTO last_bonus_week
  FROM public.user_points_ledger 
  WHERE user_id = p_user_id 
    AND activity_type IN ('weekly_outreach_bonus', 'weekly_wins_bonus')
    AND DATE(created_at) >= week_start;
    
  -- Skip if bonuses already awarded this week
  IF last_bonus_week >= week_start THEN
    RETURN;
  END IF;

  -- Calculate weekly outreach points (sum of outreach_points from user_metrics this week)
  SELECT COALESCE(SUM(value), 0) INTO week_outreach_points
  FROM public.user_metrics
  WHERE user_id = p_user_id 
    AND metric_name = 'outreach_points'
    AND created_at >= week_start;

  -- Calculate weekly wins (contacts won this week)
  SELECT COUNT(*) INTO week_wins
  FROM public.contacts
  WHERE user_id = p_user_id 
    AND status = 'won'
    AND updated_at >= week_start;

  -- Get current streak from leaderboard stats
  SELECT ls.current_streak INTO user_current_streak
  FROM public.leaderboard_stats ls
  WHERE ls.user_id = p_user_id;
  
  user_current_streak := COALESCE(user_current_streak, 0);

  -- Award weekly outreach bonus (500+ points) with explicit type cast
  IF week_outreach_points >= 500 THEN
    PERFORM public.award_points(
      p_user_id,
      'weekly_outreach_bonus'::text,
      ('Weekly outreach bonus: ' || week_outreach_points || ' points this week')::text,
      '{}'::jsonb
    );
  END IF;

  -- Award weekly wins bonus (5+ wins) with explicit type cast
  IF week_wins >= 5 THEN
    PERFORM public.award_points(
      p_user_id,
      'weekly_wins_bonus'::text,
      ('Weekly wins bonus: ' || week_wins || ' wins this week')::text,
      '{}'::jsonb
    );
  END IF;

  -- Award streak bonuses (only if haven't been awarded for this streak level)
  IF user_current_streak >= 30 AND NOT EXISTS (
    SELECT 1 FROM public.user_points_ledger 
    WHERE user_id = p_user_id AND activity_type = 'streak_bonus_30'
    AND created_at > current_date - interval '30 days'
  ) THEN
    PERFORM public.award_points(
      p_user_id,
      'streak_bonus_30'::text,
      '30-day streak milestone bonus!'::text,
      '{}'::jsonb
    );
  ELSIF user_current_streak >= 14 AND NOT EXISTS (
    SELECT 1 FROM public.user_points_ledger 
    WHERE user_id = p_user_id AND activity_type = 'streak_bonus_14'
    AND created_at > current_date - interval '14 days'
  ) THEN
    PERFORM public.award_points(
      p_user_id,
      'streak_bonus_14'::text,
      '14-day streak milestone bonus!'::text,
      '{}'::jsonb
    );
  ELSIF user_current_streak >= 7 AND NOT EXISTS (
    SELECT 1 FROM public.user_points_ledger 
    WHERE user_id = p_user_id AND activity_type = 'streak_bonus_7'
    AND created_at > current_date - interval '7 days'
  ) THEN
    PERFORM public.award_points(
      p_user_id,
      'streak_bonus_7'::text,
      '7-day streak milestone bonus!'::text,
      '{}'::jsonb
    );
  END IF;
END;
$function$;