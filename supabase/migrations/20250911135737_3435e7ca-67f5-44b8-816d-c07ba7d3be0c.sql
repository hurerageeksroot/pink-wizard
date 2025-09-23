-- Create a simple test function to isolate the issue 
CREATE OR REPLACE FUNCTION public.test_kristen_task_update()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  current_state boolean;
BEGIN
  -- Get current state
  SELECT completed INTO current_state 
  FROM user_daily_tasks 
  WHERE id = '96c03ab5-ebcb-4cdc-9559-23f2dc49bfd5';
  
  -- Try to flip it
  UPDATE user_daily_tasks 
  SET completed = NOT completed,
      completed_at = CASE WHEN NOT completed THEN now() ELSE NULL END,
      updated_at = now()
  WHERE id = '96c03ab5-ebcb-4cdc-9559-23f2dc49bfd5';
  
  -- Return result
  SELECT jsonb_build_object(
    'success', true,
    'record_id', '96c03ab5-ebcb-4cdc-9559-23f2dc49bfd5',
    'previous_state', current_state,
    'new_state', NOT current_state
  ) INTO result;
  
  RETURN result;
END;
$$;