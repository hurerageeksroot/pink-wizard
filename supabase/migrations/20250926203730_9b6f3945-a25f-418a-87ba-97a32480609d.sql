-- Create admin function to complete daily tasks
CREATE OR REPLACE FUNCTION public.admin_complete_daily_task(
  target_user_id UUID,
  task_definition_id UUID,
  challenge_day_param INTEGER,
  admin_notes TEXT DEFAULT 'Manually completed by admin'
) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_task RECORD;
  task_name TEXT;
  result jsonb;
BEGIN
  -- Only admins can use this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Get task definition name
  SELECT name INTO task_name
  FROM public.daily_tasks_definition 
  WHERE id = task_definition_id;

  IF task_name IS NULL THEN
    RAISE EXCEPTION 'Task definition not found: %', task_definition_id;
  END IF;

  -- Check if task already exists
  SELECT * INTO existing_task
  FROM public.user_daily_tasks
  WHERE user_id = target_user_id 
    AND task_id = task_definition_id
    AND challenge_day = challenge_day_param;

  IF existing_task.id IS NOT NULL THEN
    -- Update existing task to completed
    UPDATE public.user_daily_tasks
    SET 
      completed = true,
      completed_at = now(),
      updated_at = now(),
      notes = COALESCE(notes, '') || ' | ' || admin_notes
    WHERE id = existing_task.id;

    -- Award points if not already completed
    IF NOT existing_task.completed THEN
      INSERT INTO public.user_points_ledger (
        user_id,
        activity_type,
        points_earned,
        description,
        metadata,
        challenge_day,
        created_at
      ) VALUES (
        target_user_id,
        'daily_task_completed',
        10,
        'Admin completed daily task: ' || task_name,
        jsonb_build_object(
          'task_id', task_definition_id,
          'task_name', task_name,
          'challenge_day', challenge_day_param,
          'admin_completion', true,
          'admin_notes', admin_notes
        ),
        challenge_day_param,
        now()
      );
    END IF;

    result := jsonb_build_object(
      'success', true,
      'action', 'updated_existing',
      'task_id', existing_task.id,
      'task_name', task_name,
      'points_awarded', NOT existing_task.completed
    );
  ELSE
    -- Create new completed task
    INSERT INTO public.user_daily_tasks (
      user_id, 
      task_id, 
      challenge_day, 
      completed, 
      completed_at,
      notes,
      created_at, 
      updated_at
    ) VALUES (
      target_user_id,
      task_definition_id,
      challenge_day_param,
      true,
      now(),
      admin_notes,
      now(),
      now()
    ) RETURNING id INTO existing_task;

    -- Award points
    INSERT INTO public.user_points_ledger (
      user_id,
      activity_type,
      points_earned,
      description,
      metadata,
      challenge_day,
      created_at
    ) VALUES (
      target_user_id,
      'daily_task_completed',
      10,
      'Admin completed daily task: ' || task_name,
      jsonb_build_object(
        'task_id', task_definition_id,
        'task_name', task_name,
        'challenge_day', challenge_day_param,
        'admin_completion', true,
        'admin_notes', admin_notes
      ),
      challenge_day_param,
      now()
    );

    result := jsonb_build_object(
      'success', true,
      'action', 'created_new',
      'task_id', existing_task.id,
      'task_name', task_name,
      'points_awarded', true
    );
  END IF;

  -- Log admin action
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    'ADMIN_COMPLETE_DAILY_TASK',
    'daily_task',
    existing_task.id,
    jsonb_build_object(
      'target_user_id', target_user_id,
      'task_definition_id', task_definition_id,
      'task_name', task_name,
      'challenge_day', challenge_day_param,
      'admin_notes', admin_notes
    )
  );

  RETURN result;
END;
$$;