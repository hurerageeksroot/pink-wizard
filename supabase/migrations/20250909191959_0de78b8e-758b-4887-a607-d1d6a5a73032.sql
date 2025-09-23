-- Create function to update daily challenge progress when activities are completed
CREATE OR REPLACE FUNCTION public.update_daily_challenge_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  challenge_start_date DATE;
  challenge_end_date DATE;
  total_challenge_days INTEGER;
  user_record RECORD;
  days_completed INTEGER;
  current_streak INTEGER;
  longest_streak INTEGER;
  progress_percentage NUMERIC;
BEGIN
  -- Get active challenge details
  SELECT start_date, end_date, total_days
  INTO challenge_start_date, challenge_end_date, total_challenge_days
  FROM public.challenge_config
  WHERE is_active = true
  LIMIT 1;
  
  IF challenge_start_date IS NULL THEN
    RETURN; -- No active challenge
  END IF;
  
  -- Update progress for each active participant
  FOR user_record IN 
    SELECT DISTINCT ucp.user_id
    FROM public.user_challenge_progress ucp
    WHERE ucp.is_active = true
  LOOP
    -- Count unique days with activities since challenge start
    SELECT COUNT(DISTINCT DATE(a.created_at))
    INTO days_completed
    FROM public.activities a
    WHERE a.user_id = user_record.user_id
      AND DATE(a.created_at) >= challenge_start_date
      AND DATE(a.created_at) <= LEAST(challenge_end_date, CURRENT_DATE);
    
    -- Calculate current streak (consecutive days from most recent day backwards)
    WITH daily_activity AS (
      SELECT DISTINCT DATE(a.created_at) as activity_date
      FROM public.activities a
      WHERE a.user_id = user_record.user_id
        AND DATE(a.created_at) >= challenge_start_date
        AND DATE(a.created_at) <= CURRENT_DATE
      ORDER BY activity_date DESC
    ),
    streak_calculation AS (
      SELECT 
        activity_date,
        ROW_NUMBER() OVER (ORDER BY activity_date DESC) as row_num,
        activity_date + ROW_NUMBER() OVER (ORDER BY activity_date DESC) as streak_group
      FROM daily_activity
    )
    SELECT COUNT(*)
    INTO current_streak
    FROM streak_calculation
    WHERE streak_group = (
      SELECT streak_group 
      FROM streak_calculation 
      WHERE activity_date = CURRENT_DATE
      LIMIT 1
    );
    
    -- If no activity today, current streak is 0
    current_streak := COALESCE(current_streak, 0);
    
    -- Calculate longest streak (this is a simplified version - could be enhanced)
    longest_streak := GREATEST(current_streak, 
      COALESCE((SELECT longest_streak FROM public.user_challenge_progress WHERE user_id = user_record.user_id), 0)
    );
    
    -- Calculate overall progress percentage
    progress_percentage := CASE 
      WHEN total_challenge_days > 0 THEN 
        ROUND((days_completed::NUMERIC / total_challenge_days::NUMERIC) * 100, 2)
      ELSE 0 
    END;
    
    -- Update user progress
    UPDATE public.user_challenge_progress
    SET 
      total_days_completed = days_completed,
      current_streak = current_streak,
      longest_streak = longest_streak,
      overall_progress = progress_percentage,
      updated_at = now()
    WHERE user_id = user_record.user_id;
    
  END LOOP;
  
  -- Update leaderboard stats
  PERFORM public.update_leaderboard_stats();
  
  RAISE NOTICE 'Daily challenge progress updated for all participants';
END;
$function$

-- Create trigger function to update progress when activities are added
CREATE OR REPLACE FUNCTION public.trigger_daily_progress_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update if this is a new activity for today
  IF NEW.created_at::date = CURRENT_DATE THEN
    PERFORM public.update_daily_challenge_progress();
  END IF;
  
  RETURN NEW;
END;
$function$

-- Add trigger to activities table (drop first if exists)
DROP TRIGGER IF EXISTS activity_progress_update_trigger ON public.activities;
CREATE TRIGGER activity_progress_update_trigger
  AFTER INSERT ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_daily_progress_update();