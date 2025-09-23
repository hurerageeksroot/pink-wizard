-- Debug and fix task completion issues

-- Add some logging to help debug task completion issues
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
    
    -- Award or remove points based on completion status
    IF p_completed AND NOT existing_record.completed THEN
      -- Task was just completed - award points
      RAISE LOG 'Awarding points for task completion: %', task_name;
      PERFORM public.award_points(
        p_user_id,
        'daily_task_completed',
        'Completed daily task: ' || task_name,
        jsonb_build_object(
          'task_id', p_task_id,
          'task_name', task_name,
          'challenge_day', p_challenge_day
        ),
        p_challenge_day
      );
    END IF;
    
    result := jsonb_build_object(
      'success', true,
      'action', 'updated',
      'record_id', existing_record.id,
      'task_name', task_name,
      'completed', p_completed
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
      RAISE LOG 'Awarding points for new completed task: %', task_name;
      PERFORM public.award_points(
        p_user_id,
        'daily_task_completed',
        'Completed daily task: ' || task_name,
        jsonb_build_object(
          'task_id', p_task_id,
          'task_name', task_name,
          'challenge_day', p_challenge_day
        ),
        p_challenge_day
      );
    END IF;
    
    result := jsonb_build_object(
      'success', true,
      'action', 'created',
      'task_id', p_task_id,
      'task_name', task_name,
      'completed', p_completed
    );
  END IF;

  -- Manually update challenge progress without triggering other functions
  UPDATE public.user_challenge_progress 
  SET updated_at = now()
  WHERE user_id = p_user_id AND is_active = true;

  RAISE LOG 'toggle_user_daily_task completed successfully: %', result;
  
  RETURN result;
END;
$$;

-- Ensure we have an award_points function (create a simple one if it doesn't exist)
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_activity_type text,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}',
  p_challenge_day integer DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  points_to_award integer := 10; -- Default points for daily tasks
BEGIN
  -- Insert points into the ledger
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
    p_activity_type,
    points_to_award,
    p_description,
    p_metadata,
    p_challenge_day,
    now()
  );
  
  RAISE LOG 'Awarded % points to user % for %', points_to_award, p_user_id, p_activity_type;
END;
$$;