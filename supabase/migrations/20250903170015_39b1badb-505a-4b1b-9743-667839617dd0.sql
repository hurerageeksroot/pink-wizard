-- Add performance bonus tracking and management functions

-- First, add some new activity types for performance bonuses
INSERT INTO public.activity_weights (activity_type, weight, description, is_active) VALUES
('weekly_outreach_bonus', 100, 'Bonus for completing 500+ outreach points in a week', true),
('weekly_wins_bonus', 150, 'Bonus for achieving 5+ wins in a week', true),
('streak_bonus_7', 50, 'Bonus for maintaining 7-day streak', true),
('streak_bonus_14', 125, 'Bonus for maintaining 14-day streak', true),
('streak_bonus_30', 300, 'Bonus for maintaining 30-day streak', true)
ON CONFLICT (activity_type) DO UPDATE SET
  weight = EXCLUDED.weight,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Create function to check and award performance bonuses
CREATE OR REPLACE FUNCTION public.check_performance_bonuses(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  week_start date;
  week_outreach_points numeric;
  week_wins integer;
  current_streak integer;
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
  SELECT current_streak INTO current_streak
  FROM public.leaderboard_stats
  WHERE user_id = p_user_id;
  
  current_streak := COALESCE(current_streak, 0);

  -- Award weekly outreach bonus (500+ points)
  IF week_outreach_points >= 500 THEN
    PERFORM public.award_points(
      p_user_id,
      'weekly_outreach_bonus',
      'Weekly outreach bonus: ' || week_outreach_points || ' points this week'
    );
  END IF;

  -- Award weekly wins bonus (5+ wins)
  IF week_wins >= 5 THEN
    PERFORM public.award_points(
      p_user_id,
      'weekly_wins_bonus',
      'Weekly wins bonus: ' || week_wins || ' wins this week'
    );
  END IF;

  -- Award streak bonuses (only if haven't been awarded for this streak level)
  IF current_streak >= 30 AND NOT EXISTS (
    SELECT 1 FROM public.user_points_ledger 
    WHERE user_id = p_user_id AND activity_type = 'streak_bonus_30'
    AND created_at > current_date - interval '30 days'
  ) THEN
    PERFORM public.award_points(
      p_user_id,
      'streak_bonus_30',
      '30-day streak milestone bonus!'
    );
  ELSIF current_streak >= 14 AND NOT EXISTS (
    SELECT 1 FROM public.user_points_ledger 
    WHERE user_id = p_user_id AND activity_type = 'streak_bonus_14'
    AND created_at > current_date - interval '14 days'
  ) THEN
    PERFORM public.award_points(
      p_user_id,
      'streak_bonus_14',
      '14-day streak milestone bonus!'
    );
  ELSIF current_streak >= 7 AND NOT EXISTS (
    SELECT 1 FROM public.user_points_ledger 
    WHERE user_id = p_user_id AND activity_type = 'streak_bonus_7'
    AND created_at > current_date - interval '7 days'
  ) THEN
    PERFORM public.award_points(
      p_user_id,
      'streak_bonus_7',
      '7-day streak milestone bonus!'
    );
  END IF;
END;
$$;

-- Create function to trigger bonus checks for all active users
CREATE OR REPLACE FUNCTION public.trigger_weekly_bonus_checks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Check bonuses for all users who have been active in the past week
  FOR user_record IN 
    SELECT DISTINCT user_id
    FROM public.user_points_ledger
    WHERE created_at >= current_date - interval '7 days'
  LOOP
    PERFORM public.check_performance_bonuses(user_record.user_id);
  END LOOP;
END;
$$;

-- Add trigger to check bonuses when points are awarded
CREATE OR REPLACE FUNCTION public.trigger_bonus_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Schedule a bonus check for this user (async to avoid slowing down point awards)
  PERFORM public.check_performance_bonuses(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Create trigger on user_points_ledger to check for bonuses
DROP TRIGGER IF EXISTS trigger_performance_bonus_check ON public.user_points_ledger;
CREATE TRIGGER trigger_performance_bonus_check
  AFTER INSERT ON public.user_points_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_bonus_check();