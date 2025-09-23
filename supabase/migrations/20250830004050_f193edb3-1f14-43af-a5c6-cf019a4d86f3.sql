-- Create a security definer function to check if user can write to CRM data
CREATE OR REPLACE FUNCTION public.user_can_write()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  challenge_end_date DATE;
  current_date_val DATE;
  has_valid_subscription BOOLEAN := FALSE;
  has_valid_payment BOOLEAN := FALSE;
BEGIN
  -- Get current date
  SELECT CURRENT_DATE INTO current_date_val;
  
  -- Get challenge end date
  SELECT end_date INTO challenge_end_date
  FROM public.challenge_config 
  WHERE is_active = true 
  LIMIT 1;
  
  -- If challenge is still active, allow writes
  IF challenge_end_date IS NOT NULL AND current_date_val <= challenge_end_date THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has valid subscription
  SELECT EXISTS(
    SELECT 1 
    FROM public.subscribers 
    WHERE user_id = auth.uid() 
      AND subscribed = true 
      AND (subscription_end IS NULL OR subscription_end > now())
  ) INTO has_valid_subscription;
  
  IF has_valid_subscription THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has valid payment access
  SELECT EXISTS(
    SELECT 1 
    FROM public.payments 
    WHERE user_id = auth.uid() 
      AND status IN ('paid', 'demo')
      AND access_expires_at > now()
  ) INTO has_valid_payment;
  
  RETURN has_valid_payment;
END;
$$;

-- Update RLS policies for contacts table to allow read-only after challenge
DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;

CREATE POLICY "Users can insert their own contacts" ON public.contacts
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND public.user_can_write());

CREATE POLICY "Users can update their own contacts" ON public.contacts
FOR UPDATE 
USING (auth.uid() = user_id AND public.user_can_write());

CREATE POLICY "Users can delete their own contacts" ON public.contacts
FOR DELETE 
USING (auth.uid() = user_id AND public.user_can_write());

-- Update RLS policies for activities table to allow read-only after challenge
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;

CREATE POLICY "Users can insert their own activities" ON public.activities
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND public.user_can_write());

CREATE POLICY "Users can update their own activities" ON public.activities
FOR UPDATE 
USING (auth.uid() = user_id AND public.user_can_write());

CREATE POLICY "Users can delete their own activities" ON public.activities
FOR DELETE 
USING (auth.uid() = user_id AND public.user_can_write());