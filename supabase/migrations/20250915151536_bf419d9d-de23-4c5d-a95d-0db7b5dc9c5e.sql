-- Add unique constraint for user_program_tasks and fix backfill function
ALTER TABLE public.user_program_tasks 
ADD CONSTRAINT user_program_tasks_user_task_unique 
UNIQUE (user_id, program_task_definition_id);

-- Update backfill function to handle conflicts properly
CREATE OR REPLACE FUNCTION public.backfill_networking_program_task_completions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_with_events RECORD;
  incomplete_task RECORD;
  networking_event_count INTEGER;
  completed_task_count INTEGER;
BEGIN
  -- For each user who has networking events
  FOR user_with_events IN 
    SELECT DISTINCT user_id, COUNT(*) as event_count
    FROM public.networking_events 
    GROUP BY user_id
    ORDER BY user_id
  LOOP
    -- Count how many networking program tasks they've completed
    SELECT COUNT(*) INTO completed_task_count
    FROM public.user_program_tasks upt
    JOIN public.program_tasks_definition ptd ON ptd.id = upt.program_task_definition_id
    WHERE upt.user_id = user_with_events.user_id
      AND upt.completed = true
      AND ptd.name ILIKE '%networking%'
      AND ptd.is_active = true;

    -- Count their networking events
    networking_event_count := user_with_events.event_count;
    
    -- If they have more networking events than completed networking tasks, backfill
    WHILE completed_task_count < networking_event_count AND completed_task_count < 10 LOOP
      -- Find the next incomplete networking program task
      SELECT ptd.id, ptd.name
      INTO incomplete_task
      FROM public.program_tasks_definition ptd
      LEFT JOIN public.user_program_tasks upt ON (
        upt.program_task_definition_id = ptd.id 
        AND upt.user_id = user_with_events.user_id 
        AND upt.completed = true
      )
      WHERE ptd.is_active = true
        AND ptd.name ILIKE '%networking%'
        AND upt.id IS NULL  -- Task not completed yet
      ORDER BY ptd.sort_order ASC
      LIMIT 1;

      -- If we found an incomplete networking task, complete it
      IF incomplete_task.id IS NOT NULL THEN
        INSERT INTO public.user_program_tasks (
          user_id, 
          program_task_definition_id, 
          completed, 
          completed_at, 
          created_at, 
          updated_at
        ) VALUES (
          user_with_events.user_id,
          incomplete_task.id,
          true,
          now(),
          now(),
          now()
        ) ON CONFLICT (user_id, program_task_definition_id) DO UPDATE SET
          completed = true,
          completed_at = now(),
          updated_at = now();

        -- Award backfill points
        INSERT INTO public.user_points_ledger (
          user_id,
          activity_type,
          points_earned,
          description,
          metadata,
          created_at
        ) VALUES (
          user_with_events.user_id,
          'program_task_completed',
          50,
          'BACKFILL: Completed program task: ' || incomplete_task.name,
          jsonb_build_object(
            'task_id', incomplete_task.id,
            'task_name', incomplete_task.name,
            'backfilled', true,
            'reason', 'networking_events_existing'
          ),
          now()
        );

        completed_task_count := completed_task_count + 1;
      ELSE
        -- No more networking tasks to complete
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END;
$function$