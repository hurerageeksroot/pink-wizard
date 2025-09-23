-- Update user_can_write function to properly check trial access
CREATE OR REPLACE FUNCTION public.user_can_write(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  has_subscription BOOLEAN := FALSE;
  has_payment BOOLEAN := FALSE;
  has_trial BOOLEAN := FALSE;
BEGIN
  -- Use provided user_id or default to current authenticated user
  target_user_id := COALESCE(check_user_id, auth.uid());
  
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

  -- Check for active trial
  SELECT EXISTS (
    SELECT 1 FROM public.user_trials 
    WHERE user_id = target_user_id 
    AND status = 'active'
    AND trial_end_at > NOW()
  ) INTO has_trial;

  RETURN has_subscription OR has_payment OR has_trial;
END;
$$;