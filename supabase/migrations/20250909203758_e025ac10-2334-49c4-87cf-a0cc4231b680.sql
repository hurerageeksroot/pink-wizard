-- Improve admin_toggle_user_challenge function with better error handling and uniqueness safety
CREATE OR REPLACE FUNCTION public.admin_toggle_user_challenge(target_user_id uuid, enable_challenge boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_progress RECORD;
  result_message TEXT;
  operation_success BOOLEAN := false;
BEGIN
  -- Only admins can use this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Check if user exists in profiles table
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found in profiles table',
      'user_id', target_user_id
    );
  END IF;
  
  -- For safety, first deactivate ALL existing active records for this user
  -- This prevents multiple active records and ensures clean state
  UPDATE public.user_challenge_progress 
  SET is_active = false, 
      updated_at = now()
  WHERE user_id = target_user_id 
    AND is_active = true;
  
  -- Get the most recent progress record (now inactive)
  SELECT * INTO existing_progress
  FROM public.user_challenge_progress
  WHERE user_id = target_user_id
  ORDER BY updated_at DESC
  LIMIT 1;
  
  IF enable_challenge THEN
    -- Enable/enroll user in challenge
    IF existing_progress.id IS NULL THEN
      -- Create new progress record
      INSERT INTO public.user_challenge_progress (
        user_id, 
        is_active, 
        joined_at,
        current_streak,
        longest_streak,
        total_days_completed,
        overall_progress
      ) VALUES (
        target_user_id, 
        true, 
        now(),
        0,
        0,
        0,
        0.00
      );
      result_message := 'User successfully enrolled in challenge';
      operation_success := true;
    ELSE
      -- Reactivate the most recent progress record
      UPDATE public.user_challenge_progress 
      SET is_active = true, 
          joined_at = COALESCE(joined_at, now()),
          updated_at = now()
      WHERE id = existing_progress.id;
      result_message := 'User challenge participation reactivated';
      operation_success := true;
    END IF;
  ELSE
    -- Disable challenge participation (already done above, but confirm)
    IF existing_progress.id IS NULL THEN
      result_message := 'User has no challenge participation history';
      operation_success := true; -- Not an error, just info
    ELSE
      result_message := 'User challenge participation disabled';
      operation_success := true;
    END IF;
  END IF;
  
  -- Log the admin action
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    CASE WHEN enable_challenge THEN 'ENABLE_USER_CHALLENGE' ELSE 'DISABLE_USER_CHALLENGE' END,
    'user_challenge_progress',
    target_user_id,
    jsonb_build_object(
      'enabled', enable_challenge,
      'message', result_message,
      'had_existing_record', existing_progress.id IS NOT NULL
    )
  );
  
  RETURN jsonb_build_object(
    'success', operation_success,
    'message', result_message,
    'user_id', target_user_id,
    'enabled', enable_challenge,
    'timestamp', now()
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Log the error for debugging
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    'CHALLENGE_TOGGLE_ERROR',
    'user_challenge_progress',
    target_user_id,
    jsonb_build_object(
      'error_message', SQLERRM,
      'error_state', SQLSTATE,
      'enabled', enable_challenge
    )
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Database error: ' || SQLERRM,
    'user_id', target_user_id,
    'error_code', SQLSTATE
  );
END;
$$;

-- Grant execute permission to authenticated users (admins will be verified within function)
GRANT EXECUTE ON FUNCTION public.admin_toggle_user_challenge(uuid, boolean) TO authenticated;