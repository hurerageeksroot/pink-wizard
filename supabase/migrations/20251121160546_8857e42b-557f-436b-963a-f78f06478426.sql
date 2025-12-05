-- Add Sarah as admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'sarah@sarahmmurphy.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Drop and recreate user_can_write to grant admins automatic access
DROP FUNCTION IF EXISTS public.user_can_write();
DROP FUNCTION IF EXISTS public.user_can_write(uuid);

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

  -- Check for active trial
  IF EXISTS (
    SELECT 1 FROM public.user_trials
    WHERE user_id = user_id_param
      AND status = 'active'
      AND end_date > NOW()
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Also create the no-parameter version for backwards compatibility
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

-- Deactivate Sarah's challenge participation
UPDATE public.user_challenge_progress
SET is_active = false,
    updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'sarah@sarahmmurphy.com'
);