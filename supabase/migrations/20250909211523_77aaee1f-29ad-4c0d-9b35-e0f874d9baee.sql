-- Fix RLS policies and clean up orphaned data

-- First, remove the admin policies that aren't working and create proper ones
DROP POLICY IF EXISTS "Admins can insert challenge progress for users" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "Admins can update challenge progress for users" ON public.user_challenge_progress;

-- Create proper admin policies that work with the is_admin() function
CREATE POLICY "Admin can manage all challenge progress" ON public.user_challenge_progress
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Clean up orphaned user_daily_tasks that reference non-existent daily_tasks_definition
DELETE FROM public.user_daily_tasks 
WHERE task_id NOT IN (
  SELECT id FROM public.daily_tasks_definition
);

-- Create a function to safely toggle user challenge participation
CREATE OR REPLACE FUNCTION public.admin_toggle_user_challenge_safe(
  p_target_user_id uuid,
  p_enable boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_progress_id uuid;
  result jsonb;
BEGIN
  -- Only admins can use this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if challenge progress exists
  SELECT id INTO existing_progress_id
  FROM public.user_challenge_progress
  WHERE user_id = p_target_user_id;

  IF p_enable THEN
    IF existing_progress_id IS NOT NULL THEN
      -- Reactivate existing progress
      UPDATE public.user_challenge_progress
      SET is_active = true,
          updated_at = now()
      WHERE id = existing_progress_id;
      
      result := jsonb_build_object(
        'success', true,
        'action', 'reactivated',
        'message', 'Challenge participation reactivated'
      );
    ELSE
      -- Create new progress
      INSERT INTO public.user_challenge_progress (
        user_id, is_active, joined_at, updated_at
      ) VALUES (
        p_target_user_id, true, now(), now()
      );
      
      result := jsonb_build_object(
        'success', true,
        'action', 'created',
        'message', 'Challenge participation enabled'
      );
    END IF;
  ELSE
    -- Disable challenge participation
    IF existing_progress_id IS NOT NULL THEN
      UPDATE public.user_challenge_progress
      SET is_active = false,
          updated_at = now()
      WHERE id = existing_progress_id;
      
      result := jsonb_build_object(
        'success', true,
        'action', 'deactivated',
        'message', 'Challenge participation disabled'
      );
    ELSE
      result := jsonb_build_object(
        'success', true,
        'action', 'no_change',
        'message', 'User was not participating in challenge'
      );
    END IF;
  END IF;

  RETURN result;
END;
$$;

-- Fix the daily task upsert to handle foreign key constraints better
CREATE OR REPLACE FUNCTION public.upsert_user_daily_task(
  p_user_id uuid,
  p_task_id uuid,
  p_challenge_day integer,
  p_completed boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_task_id uuid;
  task_exists boolean;
  result jsonb;
BEGIN
  -- Validate user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only update own tasks';
  END IF;

  -- Check if the daily task definition actually exists
  SELECT EXISTS(
    SELECT 1 FROM public.daily_tasks_definition 
    WHERE id = p_task_id AND is_active = true
  ) INTO task_exists;

  IF NOT task_exists THEN
    RAISE EXCEPTION 'Task definition not found or inactive: %', p_task_id;
  END IF;

  -- Check if user task already exists
  SELECT id INTO existing_task_id
  FROM public.user_daily_tasks
  WHERE user_id = p_user_id 
    AND task_id = p_task_id 
    AND challenge_day = p_challenge_day;

  IF existing_task_id IS NOT NULL THEN
    -- Update existing task
    UPDATE public.user_daily_tasks
    SET completed = p_completed,
        completed_at = CASE WHEN p_completed THEN now() ELSE NULL END,
        updated_at = now()
    WHERE id = existing_task_id;
    
    result := jsonb_build_object(
      'success', true,
      'action', 'updated',
      'task_id', existing_task_id
    );
  ELSE
    -- Insert new task
    INSERT INTO public.user_daily_tasks (
      user_id, task_id, challenge_day, completed, completed_at
    ) VALUES (
      p_user_id, p_task_id, p_challenge_day, p_completed,
      CASE WHEN p_completed THEN now() ELSE NULL END
    );
    
    result := jsonb_build_object(
      'success', true,
      'action', 'created',
      'task_id', p_task_id
    );
  END IF;

  RETURN result;
END;
$$;