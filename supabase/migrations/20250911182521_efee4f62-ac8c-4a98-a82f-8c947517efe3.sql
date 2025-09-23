-- Remove the test function from previous debugging
DROP FUNCTION IF EXISTS public.test_kristen_task_update();

-- Create a function to automatically create daily tasks for a user
CREATE OR REPLACE FUNCTION public.auto_create_daily_tasks_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  task_def RECORD;
  challenge_start_date date;
  current_challenge_day integer;
BEGIN
  -- Get the current challenge start date and current day
  SELECT start_date, current_day INTO challenge_start_date, current_challenge_day
  FROM public.challenge_config 
  WHERE is_active = true 
  LIMIT 1;
  
  IF challenge_start_date IS NULL THEN
    RETURN; -- No active challenge
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
      ) ON CONFLICT (user_id, task_id, challenge_day) DO NOTHING; -- Prevent duplicates
    END LOOP;
  END LOOP;
END;
$$;

-- Create trigger function for automatic task creation
CREATE OR REPLACE FUNCTION public.trigger_auto_create_daily_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only trigger for new active challenge progress or reactivation
  IF (TG_OP = 'INSERT' AND NEW.is_active = true) OR 
     (TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true) THEN
    
    -- Create all daily tasks for this user
    PERFORM public.auto_create_daily_tasks_for_user(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add the trigger to user_challenge_progress
DROP TRIGGER IF EXISTS trigger_create_daily_tasks ON public.user_challenge_progress;
CREATE TRIGGER trigger_create_daily_tasks
  AFTER INSERT OR UPDATE ON public.user_challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_create_daily_tasks();

-- Add unique constraint to prevent duplicate tasks
ALTER TABLE public.user_daily_tasks 
DROP CONSTRAINT IF EXISTS unique_user_task_day;

ALTER TABLE public.user_daily_tasks 
ADD CONSTRAINT unique_user_task_day 
UNIQUE (user_id, task_id, challenge_day);

-- Create function to backfill missing tasks for existing participants
CREATE OR REPLACE FUNCTION public.backfill_all_daily_tasks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  participant_record RECORD;
  tasks_created integer := 0;
BEGIN
  -- Create tasks for all active challenge participants
  FOR participant_record IN 
    SELECT user_id 
    FROM public.user_challenge_progress 
    WHERE is_active = true
  LOOP
    PERFORM public.auto_create_daily_tasks_for_user(participant_record.user_id);
    tasks_created := tasks_created + 1;
  END LOOP;
  
  RETURN tasks_created;
END;
$$;