-- Fix critical bug in user_can_write function
-- BUG 1: Line 53 references non-existent column 'end_date' 
-- BUG 2: Missing 'challenge_graduate' status check
-- FIX: Use correct column 'trial_end_at' and include 'challenge_graduate' status

DROP FUNCTION IF EXISTS public.user_can_write(uuid);
DROP FUNCTION IF EXISTS public.user_can_write();

CREATE OR REPLACE FUNCTION public.user_can_write(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins always have write access
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND role = 'admin'::app_role
  ) THEN
    RETURN true;
  END IF;

  -- Check for active subscription
  IF EXISTS (
    SELECT 1 FROM public.subscribers
    WHERE user_id = user_id_param
      AND subscribed = true
      AND (subscription_end IS NULL OR subscription_end > NOW())
  ) THEN
    RETURN true;
  END IF;

  -- Check for valid payment
  IF EXISTS (
    SELECT 1 FROM public.payments
    WHERE user_id = user_id_param
      AND status = 'paid'
      AND access_expires_at > NOW()
  ) THEN
    RETURN true;
  END IF;

  -- Check for active trial (FIXED: trial_end_at instead of end_date)
  -- Also includes challenge_graduate status
  IF EXISTS (
    SELECT 1 FROM public.user_trials
    WHERE user_id = user_id_param
      AND status IN ('active', 'challenge_graduate')
      AND trial_end_at > NOW()
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Backwards compatibility version
CREATE OR REPLACE FUNCTION public.user_can_write()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.user_can_write(auth.uid());
END;
$$;