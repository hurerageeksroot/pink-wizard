-- Fix the daily progress update function with corrected streak calculation
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
  streak_counter INTEGER;
  check_date DATE;
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
    
    -- Calculate current streak (simple consecutive days counting backwards from today)
    current_streak := 0;
    check_date := CURRENT_DATE;
    
    -- Count consecutive days with activities going backwards from today
    WHILE check_date >= challenge_start_date LOOP
      IF EXISTS (
        SELECT 1 FROM public.activities a
        WHERE a.user_id = user_record.user_id
          AND DATE(a.created_at) = check_date
      ) THEN
        current_streak := current_streak + 1;
        check_date := check_date - INTERVAL '1 day';
      ELSE
        EXIT; -- Break the streak
      END IF;
    END LOOP;
    
    -- Get current longest streak from database
    SELECT COALESCE(longest_streak, 0) 
    INTO longest_streak
    FROM public.user_challenge_progress 
    WHERE user_id = user_record.user_id;
    
    -- Update longest streak if current is longer
    longest_streak := GREATEST(current_streak, longest_streak);
    
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