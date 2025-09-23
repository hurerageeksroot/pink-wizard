-- Drop the problematic trigger temporarily
DROP TRIGGER IF EXISTS update_challenge_progress_on_task_change ON public.user_daily_tasks;

-- Create a much simpler upsert function that avoids any DELETE operations
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
BEGIN
  -- Validate user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only update own tasks';
  END IF;

  -- Check if task definition exists
  IF NOT EXISTS(SELECT 1 FROM public.daily_tasks_definition WHERE id = p_task_id AND is_active = true) THEN
    RAISE EXCEPTION 'Task definition not found or inactive: %', p_task_id;
  END IF;

  -- Try to find existing record
  SELECT * INTO existing_record
  FROM public.user_daily_tasks
  WHERE user_id = p_user_id 
    AND task_id = p_task_id 
    AND challenge_day = p_challenge_day;

  IF existing_record.id IS NOT NULL THEN
    -- Update existing record
    UPDATE public.user_daily_tasks
    SET 
      completed = p_completed,
      completed_at = CASE WHEN p_completed THEN now() ELSE NULL END,
      updated_at = now()
    WHERE id = existing_record.id;
    
    result := jsonb_build_object(
      'success', true,
      'action', 'updated',
      'record_id', existing_record.id
    );
  ELSE
    -- Insert new record
    INSERT INTO public.user_daily_tasks (
      user_id, task_id, challenge_day, completed, completed_at, created_at, updated_at
    ) VALUES (
      p_user_id, p_task_id, p_challenge_day, p_completed,
      CASE WHEN p_completed THEN now() ELSE NULL END,
      now(), now()
    );
    
    result := jsonb_build_object(
      'success', true,
      'action', 'created',
      'task_id', p_task_id
    );
  END IF;

  -- Manually update challenge progress without triggering other functions
  UPDATE public.user_challenge_progress 
  SET updated_at = now()
  WHERE user_id = p_user_id AND is_active = true;

  RETURN result;
END;
$$;