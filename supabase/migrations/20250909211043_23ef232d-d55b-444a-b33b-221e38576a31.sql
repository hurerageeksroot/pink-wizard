-- Fix RLS policies for admin challenge management
-- Allow admins to insert and update user challenge progress
CREATE POLICY "Admins can insert challenge progress for users" ON public.user_challenge_progress
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update challenge progress for users" ON public.user_challenge_progress
FOR UPDATE 
USING (is_admin());

-- Create a proper upsert function for daily tasks to avoid DELETE operations
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
  result jsonb;
BEGIN
  -- Validate user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: can only update own tasks';
  END IF;

  -- Check if task already exists
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