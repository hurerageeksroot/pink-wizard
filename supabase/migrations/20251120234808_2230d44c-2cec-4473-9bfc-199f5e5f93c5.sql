-- Update user_can_write function to recognize challenge_graduate status
-- Keep original parameter name to avoid breaking changes
CREATE OR REPLACE FUNCTION public.user_can_write(user_id_param UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id UUID;
  has_subscription BOOLEAN := FALSE;
  has_payment BOOLEAN := FALSE;
  has_trial BOOLEAN := FALSE;
BEGIN
  -- Use provided user_id or default to current authenticated user
  target_user_id := COALESCE(user_id_param, auth.uid());
  
  -- Return false if no user
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check for active subscription
  SELECT EXISTS (
    SELECT 1 FROM public.subscribers 
    WHERE user_id = target_user_id 
    AND subscribed = TRUE
  ) INTO has_subscription;

  -- Check for valid payment with unexpired access
  SELECT EXISTS (
    SELECT 1 FROM public.payments 
    WHERE user_id = target_user_id 
    AND status IN ('paid', 'demo')
    AND access_expires_at > NOW()
  ) INTO has_payment;

  -- Check for active trial OR challenge_graduate status (both with valid expiration)
  SELECT EXISTS (
    SELECT 1 FROM public.user_trials 
    WHERE user_id = target_user_id 
    AND status IN ('active', 'challenge_graduate')
    AND trial_end_at > NOW()
  ) INTO has_trial;

  RETURN has_subscription OR has_payment OR has_trial;
END;
$$;