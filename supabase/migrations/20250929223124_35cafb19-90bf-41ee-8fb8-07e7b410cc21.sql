-- Fix timezone-aware task creation and restore Vanessa K's missing completions

-- Update auto_create_daily_tasks_for_user to use timezone-aware day calculation
CREATE OR REPLACE FUNCTION public.auto_create_daily_tasks_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  task_def RECORD;
  user_timezone text;
  current_challenge_day integer;
BEGIN
  -- Get user's timezone from profile
  SELECT timezone INTO user_timezone
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Default to America/New_York if no timezone set
  user_timezone := COALESCE(user_timezone, 'America/New_York');
  
  -- Get timezone-aware current challenge day
  SELECT public.get_user_challenge_day(p_user_id, user_timezone) 
  INTO current_challenge_day;
  
  IF current_challenge_day IS NULL OR current_challenge_day < 1 THEN
    RETURN; -- No active challenge or invalid day
  END IF;
  
  -- Create tasks for all active task definitions for all days up to current day
  FOR task_def IN 
    SELECT id, name 
    FROM public.daily_tasks_definition 
    WHERE is_active = true
  LOOP
    -- Create tasks for each day from 1 to current challenge day
    FOR day_num IN 1..current_challenge_day LOOP
      INSERT INTO public.user_daily_tasks (
        user_id, 
        task_id, 
        challenge_day, 
        completed, 
        created_at, 
        updated_at
      ) VALUES (
        p_user_id,
        task_def.id,
        day_num,
        false,
        now(),
        now()
      ) ON CONFLICT (user_id, task_id, challenge_day) DO NOTHING; -- Prevent duplicates and overwrites
    END LOOP;
  END LOOP;
END;
$$;

-- Restore Vanessa K's missing task completions for Day 21 (9/28/2025)
UPDATE public.user_daily_tasks
SET 
  completed = true,
  completed_at = '2025-09-28 02:22:39+00'::timestamptz,
  updated_at = now()
WHERE user_id = 'f9a2dbf8-81fa-4fef-860e-77eaec1bd1f4'
  AND challenge_day = 21
  AND task_id IN (
    'a5256abc-8dd8-432c-b836-bb8f2bb8bf8b',  -- Cold Contact #1
    '1aa9b733-8d2e-4e30-85b0-4508e21ed942',  -- Warm Contact
    '49fc419a-c128-4797-adf9-3f5b91303359'   -- Social Media Touch
  );

-- Update leaderboard stats to reflect corrected completions
SELECT public.update_daily_challenge_progress();