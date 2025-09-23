-- Phase 1: Add timezone support to profiles table
ALTER TABLE public.profiles 
ADD COLUMN timezone text DEFAULT 'America/New_York';

-- Phase 2: Create timezone-aware challenge day calculation function
CREATE OR REPLACE FUNCTION public.get_user_challenge_day(user_id_param uuid, user_timezone text DEFAULT 'UTC')
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  challenge_start_date date;
  current_day_in_timezone date;
  days_diff integer;
  calculated_day integer;
BEGIN
  -- Get the active challenge start date
  SELECT start_date INTO challenge_start_date
  FROM public.challenge_config 
  WHERE is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF challenge_start_date IS NULL THEN
    RETURN 1;
  END IF;
  
  -- Get current date in user's timezone
  current_day_in_timezone := (now() AT TIME ZONE user_timezone)::date;
  
  -- Calculate days since challenge started
  days_diff := current_day_in_timezone - challenge_start_date;
  
  -- Calculate current challenge day (1-indexed, minimum 1)
  calculated_day := GREATEST(1, days_diff + 1);
  
  RETURN calculated_day;
END;
$$;

-- Phase 3: Create function to get current week for user based on timezone
CREATE OR REPLACE FUNCTION public.get_user_current_week(user_id_param uuid, user_timezone text DEFAULT 'UTC')
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  challenge_day integer;
  current_week integer;
BEGIN
  -- Get the current challenge day for the user
  SELECT public.get_user_challenge_day(user_id_param, user_timezone) INTO challenge_day;
  
  -- Calculate current week (7 days per week, starting from week 1)
  current_week := CEILING(challenge_day::numeric / 7.0)::integer;
  
  -- Ensure minimum week is 1
  RETURN GREATEST(1, current_week);
END;
$$;

-- Phase 4: Create admin function to manually complete weekly tasks
CREATE OR REPLACE FUNCTION public.admin_complete_weekly_task(
  target_user_id uuid,
  task_id_param uuid,
  week_number_param integer,
  admin_notes text DEFAULT 'Manually completed by admin'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  task_name text;
  points_awarded integer := 25; -- Standard weekly task points
  existing_task_id uuid;
  result jsonb;
BEGIN
  -- Only admins can use this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Get task name
  SELECT name INTO task_name
  FROM public.weekly_tasks_definition 
  WHERE id = task_id_param;
  
  IF task_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Task definition not found');
  END IF;
  
  -- Check if user already has this task for this week
  SELECT id INTO existing_task_id
  FROM public.user_weekly_tasks
  WHERE user_id = target_user_id 
    AND task_id = task_id_param 
    AND week_number = week_number_param
  LIMIT 1;
  
  -- Update existing task or create new one
  IF existing_task_id IS NOT NULL THEN
    UPDATE public.user_weekly_tasks
    SET 
      completed = true,
      completed_at = now(),
      notes = admin_notes,
      updated_at = now()
    WHERE id = existing_task_id;
  ELSE
    INSERT INTO public.user_weekly_tasks (
      user_id, task_id, week_number, completed, completed_at, notes, created_at, updated_at
    ) VALUES (
      target_user_id, task_id_param, week_number_param, true, now(), admin_notes, now(), now()
    );
  END IF;
  
  -- Award points
  INSERT INTO public.user_points_ledger (
    user_id,
    activity_type,
    points_earned,
    description,
    metadata,
    created_at
  ) VALUES (
    target_user_id,
    'weekly_task_completed',
    points_awarded,
    'Completed weekly task: ' || task_name || ' (Week ' || week_number_param || ')',
    jsonb_build_object(
      'task_id', task_id_param,
      'task_name', task_name,
      'week_number', week_number_param,
      'admin_completion', true,
      'completed_by', auth.uid()
    ),
    now()
  );
  
  -- Log admin action
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    'MANUAL_TASK_COMPLETION',
    'weekly_task',
    existing_task_id,
    jsonb_build_object(
      'target_user_id', target_user_id,
      'task_name', task_name,
      'week_number', week_number_param,
      'points_awarded', points_awarded
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'task_name', task_name,
    'week_number', week_number_param,
    'points_awarded', points_awarded,
    'action', CASE WHEN existing_task_id IS NOT NULL THEN 'updated' ELSE 'created' END
  );
END;
$$;

-- Phase 5: Fix Michael's incomplete Week 1 tasks by completing them
-- Complete his remaining Week 1 tasks
SELECT public.admin_complete_weekly_task(
  '1df2c88c-efc7-43e6-b3ee-ee6ffd9b1f82'::uuid,
  '9e457d0c-7e02-415f-a572-5429d727b649'::uuid,  -- 2nd weekly post
  1,
  'Retroactively completed - user missed due to week transition timing issue'
);

SELECT public.admin_complete_weekly_task(
  '1df2c88c-efc7-43e6-b3ee-ee6ffd9b1f82'::uuid,
  '56ea541b-f9c9-4343-8585-4347f7a02b65'::uuid,  -- 3rd weekly post
  1,
  'Retroactively completed - user missed due to week transition timing issue'
);

-- Clean up duplicate weekly task entries for Michael
WITH duplicate_tasks AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY user_id, task_id, week_number 
           ORDER BY 
             CASE WHEN completed THEN 0 ELSE 1 END,  -- Prefer completed tasks
             completed_at DESC NULLS LAST,           -- Then most recent completion
             created_at ASC                          -- Then earliest creation
         ) as rn
  FROM public.user_weekly_tasks
  WHERE user_id = '1df2c88c-efc7-43e6-b3ee-ee6ffd9b1f82'::uuid
)
DELETE FROM public.user_weekly_tasks 
WHERE id IN (
  SELECT id FROM duplicate_tasks WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.user_weekly_tasks 
ADD CONSTRAINT user_weekly_tasks_unique_user_task_week 
UNIQUE (user_id, task_id, week_number);