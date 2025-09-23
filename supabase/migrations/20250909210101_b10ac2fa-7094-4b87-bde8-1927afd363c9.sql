-- Fix search path security issue in ensure_user_daily_task_exists function
CREATE OR REPLACE FUNCTION public.ensure_user_daily_task_exists(
  p_user_id UUID,
  p_task_id UUID,
  p_challenge_day INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_task_id UUID;
BEGIN
  -- Use INSERT ... ON CONFLICT to ensure task exists (upsert)
  INSERT INTO public.user_daily_tasks (
    user_id,
    task_id,
    challenge_day,
    completed,
    created_at
  ) VALUES (
    p_user_id,
    p_task_id,
    p_challenge_day,
    false,
    now()
  )
  ON CONFLICT (user_id, task_id, challenge_day) 
  DO NOTHING
  RETURNING id INTO v_task_id;
  
  -- If no ID was returned (conflict occurred), get the existing one
  IF v_task_id IS NULL THEN
    SELECT id INTO v_task_id
    FROM public.user_daily_tasks
    WHERE user_id = p_user_id 
      AND task_id = p_task_id 
      AND challenge_day = p_challenge_day;
  END IF;
  
  RETURN v_task_id;
END;
$$;