-- Update the daily challenge progress function to calculate based on complete days
CREATE OR REPLACE FUNCTION public.update_daily_challenge_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  challenge_record RECORD;
  user_record RECORD;
  complete_days_count INTEGER;
  current_streak_count INTEGER;
  longest_streak_count INTEGER;
  day_cursor DATE;
  streak_active BOOLEAN;
  temp_streak INTEGER;
BEGIN
  -- Get active challenge
  SELECT * INTO challenge_record
  FROM public.challenge_config
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF challenge_record.id IS NULL THEN
    RAISE NOTICE 'No active challenge found';
    RETURN;
  END IF;
  
  -- Process each user with challenge progress
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM public.user_challenge_progress 
    WHERE is_active = true
  LOOP
    -- Calculate complete days (days where all daily tasks were completed)
    SELECT COUNT(*) INTO complete_days_count
    FROM (
      SELECT udt.challenge_day
      FROM public.user_daily_tasks udt
      JOIN public.daily_tasks_definition dtd ON dtd.id = udt.task_id
      WHERE udt.user_id = user_record.user_id 
        AND udt.completed = true
        AND dtd.is_active = true
      GROUP BY udt.challenge_day
      HAVING COUNT(*) = (
        SELECT COUNT(*) 
        FROM public.daily_tasks_definition 
        WHERE is_active = true
      )
    ) complete_days;
    
    -- Calculate current streak (consecutive complete days ending today or yesterday)
    current_streak_count := 0;
    streak_active := true;
    day_cursor := CURRENT_DATE;
    
    -- Check if today or yesterday had all tasks completed
    WHILE streak_active AND day_cursor >= challenge_record.start_date LOOP
      -- Check if this day had all tasks completed
      IF EXISTS (
        SELECT 1
        FROM (
          SELECT udt.challenge_day
          FROM public.user_daily_tasks udt
          JOIN public.daily_tasks_definition dtd ON dtd.id = udt.task_id
          WHERE udt.user_id = user_record.user_id 
            AND udt.completed = true
            AND dtd.is_active = true
            AND udt.challenge_day = (day_cursor - challenge_record.start_date + 1)::INTEGER
          GROUP BY udt.challenge_day
          HAVING COUNT(*) = (
            SELECT COUNT(*) 
            FROM public.daily_tasks_definition 
            WHERE is_active = true
          )
        ) day_check
      ) THEN
        current_streak_count := current_streak_count + 1;
        day_cursor := day_cursor - 1;
      ELSE
        -- If it's the first day we're checking and it's not complete, streak is 0
        IF day_cursor = CURRENT_DATE THEN
          current_streak_count := 0;
          day_cursor := day_cursor - 1;
        ELSE
          streak_active := false;
        END IF;
      END IF;
    END LOOP;
    
    -- Calculate longest streak
    longest_streak_count := 0;
    temp_streak := 0;
    
    FOR day_cursor IN 
      SELECT DISTINCT challenge_day 
      FROM public.user_daily_tasks 
      WHERE user_id = user_record.user_id
      ORDER BY challenge_day
    LOOP
      -- Check if this day had all tasks completed
      IF EXISTS (
        SELECT 1
        FROM (
          SELECT udt.challenge_day
          FROM public.user_daily_tasks udt
          JOIN public.daily_tasks_definition dtd ON dtd.id = udt.task_id
          WHERE udt.user_id = user_record.user_id 
            AND udt.completed = true
            AND dtd.is_active = true
            AND udt.challenge_day = day_cursor
          GROUP BY udt.challenge_day
          HAVING COUNT(*) = (
            SELECT COUNT(*) 
            FROM public.daily_tasks_definition 
            WHERE is_active = true
          )
        ) day_check
      ) THEN
        temp_streak := temp_streak + 1;
        longest_streak_count := GREATEST(longest_streak_count, temp_streak);
      ELSE
        temp_streak := 0;
      END IF;
    END LOOP;
    
    -- Update user challenge progress
    UPDATE public.user_challenge_progress 
    SET 
      total_days_completed = complete_days_count,
      current_streak = current_streak_count,
      longest_streak = GREATEST(longest_streak, longest_streak_count),
      overall_progress = CASE 
        WHEN challenge_record.total_days > 0 
        THEN ROUND((complete_days_count::NUMERIC / challenge_record.total_days::NUMERIC) * 100, 2)
        ELSE 0 
      END,
      updated_at = NOW()
    WHERE user_id = user_record.user_id AND is_active = true;
    
  END LOOP;
  
  RAISE NOTICE 'Daily challenge progress updated for all active participants';
END;
$$;

-- Create trigger function for user_daily_tasks
CREATE OR REPLACE FUNCTION public.trigger_challenge_progress_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call the progress update function when daily tasks are modified
  PERFORM public.update_daily_challenge_progress();
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on user_daily_tasks
DROP TRIGGER IF EXISTS update_challenge_progress_on_task_change ON public.user_daily_tasks;
CREATE TRIGGER update_challenge_progress_on_task_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_daily_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_challenge_progress_update();

-- Add function to get today's full completions count
CREATE OR REPLACE FUNCTION public.get_todays_full_completions()
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  challenge_record RECORD;
  current_day INTEGER;
  completions_count INTEGER;
BEGIN
  -- Get active challenge and current day
  SELECT cc.*, 
         CASE 
           WHEN CURRENT_DATE BETWEEN cc.start_date AND cc.end_date 
           THEN (CURRENT_DATE - cc.start_date + 1)::INTEGER
           ELSE 0
         END as current_challenge_day
  INTO challenge_record
  FROM public.challenge_config cc
  WHERE cc.is_active = true
  ORDER BY cc.created_at DESC
  LIMIT 1;
  
  IF challenge_record.id IS NULL OR challenge_record.current_challenge_day <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Count users who completed all tasks for today
  SELECT COUNT(*) INTO completions_count
  FROM (
    SELECT udt.user_id
    FROM public.user_daily_tasks udt
    JOIN public.daily_tasks_definition dtd ON dtd.id = udt.task_id
    WHERE udt.challenge_day = challenge_record.current_challenge_day
      AND udt.completed = true
      AND dtd.is_active = true
    GROUP BY udt.user_id
    HAVING COUNT(*) = (
      SELECT COUNT(*) 
      FROM public.daily_tasks_definition 
      WHERE is_active = true
    )
  ) complete_users;
  
  RETURN COALESCE(completions_count, 0);
END;
$$;

-- Run initial update to recalculate all progress based on complete days
SELECT public.update_daily_challenge_progress();