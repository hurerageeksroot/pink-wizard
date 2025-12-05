-- Fix admin_complete_daily_task to handle service role access
-- This allows the function to be called from edge functions with service role
-- while maintaining security for direct user calls

CREATE OR REPLACE FUNCTION admin_complete_daily_task(
  target_user_id UUID,
  task_definition_id UUID, 
  challenge_day_param INTEGER,
  admin_notes TEXT DEFAULT 'Completed by admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_result JSONB;
  current_user_id UUID;
  admin_user_id UUID;
BEGIN
  -- Enhanced security check: Allow service role OR admin users
  IF NOT (auth.role() = 'service_role' OR is_admin()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges or service role required.';
  END IF;

  -- Get current user context for audit logging
  current_user_id := auth.uid();
  
  -- For service role calls, use a system admin ID for audit purposes
  -- For user calls, use the actual admin user ID
  IF auth.role() = 'service_role' THEN
    -- Use the first admin user for audit purposes when called via service role
    SELECT user_id INTO admin_user_id 
    FROM public.user_roles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    -- Fallback to system UUID if no admin found
    admin_user_id := COALESCE(admin_user_id, '00000000-0000-0000-0000-000000000000'::UUID);
  ELSE
    admin_user_id := current_user_id;
  END IF;

  -- Call the existing toggle function to complete the task
  SELECT toggle_user_daily_task(
    target_user_id,
    task_definition_id,
    challenge_day_param,
    true  -- Mark as completed
  ) INTO task_result;

  -- Enhanced audit logging with context
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    admin_user_id,
    'ADMIN_COMPLETE_DAILY_TASK',
    'daily_task',
    task_definition_id,
    jsonb_build_object(
      'target_user_id', target_user_id,
      'task_definition_id', task_definition_id,
      'challenge_day', challenge_day_param,
      'notes', admin_notes,
      'called_by_role', auth.role(),
      'timestamp', now()
    )
  );

  -- Return enhanced result with audit info
  RETURN jsonb_build_object(
    'success', true,
    'task_result', task_result,
    'admin_action', jsonb_build_object(
      'performed_by', admin_user_id,
      'role_context', auth.role(),
      'target_user', target_user_id,
      'notes', admin_notes
    )
  );

EXCEPTION WHEN OTHERS THEN
  -- Enhanced error logging
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    COALESCE(admin_user_id, current_user_id),
    'ADMIN_COMPLETE_DAILY_TASK_ERROR',
    'daily_task',
    task_definition_id,
    jsonb_build_object(
      'error_message', SQLERRM,
      'target_user_id', target_user_id,
      'task_definition_id', task_definition_id,
      'challenge_day', challenge_day_param,
      'called_by_role', auth.role(),
      'timestamp', now()
    )
  );
  
  RAISE EXCEPTION 'Failed to complete daily task: %', SQLERRM;
END;
$$;