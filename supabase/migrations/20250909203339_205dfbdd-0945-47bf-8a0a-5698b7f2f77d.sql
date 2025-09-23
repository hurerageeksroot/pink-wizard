-- Create RPC function for admin to toggle user challenge participation
CREATE OR REPLACE FUNCTION public.admin_toggle_user_challenge(target_user_id uuid, enable_challenge boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_progress RECORD;
  result_message TEXT;
BEGIN
  -- Only admins can use this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Check if user exists in profiles table
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found'
    );
  END IF;
  
  -- Check for existing progress record
  SELECT * INTO existing_progress
  FROM public.user_challenge_progress
  WHERE user_id = target_user_id;
  
  IF enable_challenge THEN
    -- Enable/enroll user in challenge
    IF existing_progress.id IS NULL THEN
      -- Create new progress record
      INSERT INTO public.user_challenge_progress (
        user_id, 
        is_active, 
        joined_at
      ) VALUES (
        target_user_id, 
        true, 
        now()
      );
      result_message := 'User successfully enrolled in challenge';
    ELSIF existing_progress.is_active = false THEN
      -- Reactivate existing progress
      UPDATE public.user_challenge_progress 
      SET is_active = true, 
          joined_at = COALESCE(joined_at, now()),
          updated_at = now()
      WHERE user_id = target_user_id;
      result_message := 'User challenge participation reactivated';
    ELSE
      result_message := 'User is already an active challenge participant';
    END IF;
  ELSE
    -- Disable challenge participation
    IF existing_progress.id IS NULL OR existing_progress.is_active = false THEN
      result_message := 'User is not currently a challenge participant';
    ELSE
      -- Deactivate challenge participation
      UPDATE public.user_challenge_progress 
      SET is_active = false, 
          updated_at = now()
      WHERE user_id = target_user_id;
      result_message := 'User challenge participation disabled';
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', result_message,
    'user_id', target_user_id,
    'enabled', enable_challenge
  );
END;
$$;