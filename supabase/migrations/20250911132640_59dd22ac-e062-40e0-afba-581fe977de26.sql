-- Fix task completion issues with better logging and error handling

-- First check what award_points function exists and fix the toggle function
CREATE OR REPLACE FUNCTION public.toggle_user_daily_task(
  p_user_id uuid,
  p_task_id uuid,
  p_challenge_day integer,
  p_completed boolean
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_record RECORD;
  result jsonb;
  task_name text;
  points_awarded boolean := false;
BEGIN
  -- Log the input parameters for debugging
  RAISE LOG 'toggle_user_daily_task called: user_id=%, task_id=%, challenge_day=%, completed=%', 
    p_user_id, p_task_id, p_challenge_day, p_completed;

  -- Validate user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only update own tasks';
  END IF;

  -- Check if task definition exists and get task name
  SELECT name INTO task_name
  FROM public.daily_tasks_definition 
  WHERE id = p_task_id AND is_active = true;

  IF task_name IS NULL THEN
    RAISE EXCEPTION 'Task definition not found or inactive: %', p_task_id;
  END IF;

  RAISE LOG 'Found task definition: %', task_name;

  -- Try to find existing record
  SELECT * INTO existing_record
  FROM public.user_daily_tasks
  WHERE user_id = p_user_id 
    AND task_id = p_task_id 
    AND challenge_day = p_challenge_day;

  IF existing_record.id IS NOT NULL THEN
    RAISE LOG 'Updating existing record: %, current completed: %, new completed: %', 
      existing_record.id, existing_record.completed, p_completed;
      
    -- Update existing record
    UPDATE public.user_daily_tasks
    SET 
      completed = p_completed,
      completed_at = CASE WHEN p_completed THEN now() ELSE NULL END,
      updated_at = now()
    WHERE id = existing_record.id;
    
    -- Check if we should award points (task just completed)
    IF p_completed AND NOT existing_record.completed THEN
      -- Task was just completed - try to award points
      RAISE LOG 'Task completed, attempting to award points: %', task_name;
      
      -- Insert points directly into the ledger (bypass award_points function issues)
      INSERT INTO public.user_points_ledger (
        user_id,
        activity_type,
        points_earned,
        description,
        metadata,
        challenge_day,
        created_at
      ) VALUES (
        p_user_id,
        'daily_task_completed',
        10, -- Default points for daily tasks
        'Completed daily task: ' || task_name,
        jsonb_build_object(
          'task_id', p_task_id,
          'task_name', task_name,
          'challenge_day', p_challenge_day
        ),
        p_challenge_day,
        now()
      );
      
      points_awarded := true;
      RAISE LOG 'Points awarded successfully for task: %', task_name;
    END IF;
    
    result := jsonb_build_object(
      'success', true,
      'action', 'updated',
      'record_id', existing_record.id,
      'task_name', task_name,
      'completed', p_completed,
      'points_awarded', points_awarded
    );
  ELSE
    RAISE LOG 'Creating new record for task: %', task_name;
    
    -- Insert new record
    INSERT INTO public.user_daily_tasks (
      user_id, task_id, challenge_day, completed, completed_at, created_at, updated_at
    ) VALUES (
      p_user_id, p_task_id, p_challenge_day, p_completed,
      CASE WHEN p_completed THEN now() ELSE NULL END,
      now(), now()
    );
    
    -- Award points if completed
    IF p_completed THEN
      RAISE LOG 'New task completed, awarding points: %', task_name;
      
      -- Insert points directly into the ledger
      INSERT INTO public.user_points_ledger (
        user_id,
        activity_type,
        points_earned,
        description,
        metadata,
        challenge_day,
        created_at
      ) VALUES (
        p_user_id,
        'daily_task_completed',
        10, -- Default points for daily tasks
        'Completed daily task: ' || task_name,
        jsonb_build_object(
          'task_id', p_task_id,
          'task_name', task_name,
          'challenge_day', p_challenge_day
        ),
        p_challenge_day,
        now()
      );
      
      points_awarded := true;
      RAISE LOG 'Points awarded successfully for new task: %', task_name;
    END IF;
    
    result := jsonb_build_object(
      'success', true,
      'action', 'created',
      'task_id', p_task_id,
      'task_name', task_name,
      'completed', p_completed,
      'points_awarded', points_awarded
    );
  END IF;

  -- Update challenge progress
  UPDATE public.user_challenge_progress 
  SET updated_at = now()
  WHERE user_id = p_user_id AND is_active = true;

  RAISE LOG 'toggle_user_daily_task completed successfully: %', result;
  
  RETURN result;
END;
$$;