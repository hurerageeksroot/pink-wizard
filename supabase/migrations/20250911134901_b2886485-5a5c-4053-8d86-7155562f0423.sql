-- Improve the toggle_user_daily_task function with better error handling and logging
CREATE OR REPLACE FUNCTION public.toggle_user_daily_task(
  p_user_id uuid, 
  p_task_id uuid, 
  p_challenge_day integer, 
  p_completed boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  existing_record RECORD;
  result jsonb;
  task_name text;
  points_awarded boolean := false;
  update_result integer;
BEGIN
  -- Enhanced logging for debugging
  RAISE LOG '[TOGGLE_TASK] Called with user_id=%, task_id=%, challenge_day=%, completed=%', 
    p_user_id, p_task_id, p_challenge_day, p_completed;

  -- Validate user authorization
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only update own tasks';
  END IF;

  -- Validate task definition exists and get task name
  SELECT name INTO task_name
  FROM public.daily_tasks_definition 
  WHERE id = p_task_id AND is_active = true;

  IF task_name IS NULL THEN
    RAISE EXCEPTION 'Task definition not found or inactive: %', p_task_id;
  END IF;

  RAISE LOG '[TOGGLE_TASK] Found valid task definition: % (name: %)', p_task_id, task_name;

  -- Find existing record with detailed logging
  SELECT * INTO existing_record
  FROM public.user_daily_tasks
  WHERE user_id = p_user_id 
    AND task_id = p_task_id 
    AND challenge_day = p_challenge_day;

  IF existing_record.id IS NOT NULL THEN
    RAISE LOG '[TOGGLE_TASK] Found existing record id=%, current_completed=%, requested_completed=%', 
      existing_record.id, existing_record.completed, p_completed;
      
    -- Update existing record with explicit WHERE clause
    UPDATE public.user_daily_tasks
    SET 
      completed = p_completed,
      completed_at = CASE WHEN p_completed THEN now() ELSE NULL END,
      updated_at = now()
    WHERE id = existing_record.id;
    
    -- Verify the update actually happened
    GET DIAGNOSTICS update_result = ROW_COUNT;
    RAISE LOG '[TOGGLE_TASK] Update affected % rows for record id=%', update_result, existing_record.id;
    
    IF update_result = 0 THEN
      RAISE EXCEPTION 'Failed to update task record id=%', existing_record.id;
    END IF;
    
    -- Award points if task was just completed
    IF p_completed AND NOT existing_record.completed THEN
      RAISE LOG '[TOGGLE_TASK] Task newly completed, awarding points for: %', task_name;
      
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
        10,
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
      RAISE LOG '[TOGGLE_TASK] Points awarded successfully for task: %', task_name;
    END IF;
    
    result := jsonb_build_object(
      'success', true,
      'action', 'updated',
      'record_id', existing_record.id,
      'task_name', task_name,
      'completed', p_completed,
      'points_awarded', points_awarded,
      'rows_affected', update_result
    );
  ELSE
    RAISE LOG '[TOGGLE_TASK] No existing record found, creating new task record';
    
    -- Insert new record
    INSERT INTO public.user_daily_tasks (
      user_id, task_id, challenge_day, completed, completed_at, created_at, updated_at
    ) VALUES (
      p_user_id, p_task_id, p_challenge_day, p_completed,
      CASE WHEN p_completed THEN now() ELSE NULL END,
      now(), now()
    ) RETURNING id INTO existing_record;
    
    RAISE LOG '[TOGGLE_TASK] Created new record with id=%', existing_record.id;
    
    -- Award points if completed on creation
    IF p_completed THEN
      RAISE LOG '[TOGGLE_TASK] New task completed immediately, awarding points: %', task_name;
      
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
        10,
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
      RAISE LOG '[TOGGLE_TASK] Points awarded for new completed task: %', task_name;
    END IF;
    
    result := jsonb_build_object(
      'success', true,
      'action', 'created',
      'record_id', existing_record.id,
      'task_id', p_task_id,
      'task_name', task_name,
      'completed', p_completed,
      'points_awarded', points_awarded
    );
  END IF;

  -- Update challenge progress timestamp
  UPDATE public.user_challenge_progress 
  SET updated_at = now()
  WHERE user_id = p_user_id AND is_active = true;

  RAISE LOG '[TOGGLE_TASK] Function completed successfully with result: %', result;
  
  RETURN result;
END;
$$;