-- Create function to auto-complete networking program tasks
CREATE OR REPLACE FUNCTION public.auto_complete_networking_program_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  incomplete_task RECORD;
BEGIN
  -- Find the next incomplete networking program task for this user
  SELECT ptd.id, ptd.name
  INTO incomplete_task
  FROM public.program_tasks_definition ptd
  LEFT JOIN public.user_program_tasks upt ON (
    upt.task_id = ptd.id 
    AND upt.user_id = NEW.user_id 
    AND upt.completed = true
  )
  WHERE ptd.is_active = true
    AND ptd.name ILIKE '%networking%'
    AND upt.id IS NULL  -- Task not completed yet
  ORDER BY ptd.sort_order ASC
  LIMIT 1;

  -- If we found an incomplete networking task, complete it
  IF incomplete_task.id IS NOT NULL THEN
    -- Insert or update the user program task as completed
    INSERT INTO public.user_program_tasks (
      user_id, 
      task_id, 
      completed, 
      completed_at, 
      created_at, 
      updated_at
    ) VALUES (
      NEW.user_id,
      incomplete_task.id,
      true,
      now(),
      now(),
      now()
    ) ON CONFLICT (user_id, task_id) DO UPDATE SET
      completed = true,
      completed_at = now(),
      updated_at = now();

    -- Award points for completing the program task
    INSERT INTO public.user_points_ledger (
      user_id,
      activity_type,
      points_earned,
      description,
      metadata,
      created_at
    ) VALUES (
      NEW.user_id,
      'program_task_completed',
      50,
      'Completed program task: ' || incomplete_task.name,
      jsonb_build_object(
        'task_id', incomplete_task.id,
        'task_name', incomplete_task.name,
        'auto_completed_by', 'networking_event',
        'networking_event_id', NEW.id
      ),
      now()
    );
  END IF;

  RETURN NEW;
END;
$function$