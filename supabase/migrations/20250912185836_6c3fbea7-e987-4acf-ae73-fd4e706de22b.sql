-- Fix remaining functions without proper search_path security settings
-- Based on the security warning, we need to ensure all functions have SET search_path

-- Check for functions that might be missing search_path and update them
-- Update commonly used functions that may be missing proper search_path

CREATE OR REPLACE FUNCTION public.user_is_challenge_participant(user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF user_id_param IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_challenge_progress 
    WHERE user_id = user_id_param AND is_active = true
  );
END;
$$;

-- Ensure other critical functions have proper search_path
CREATE OR REPLACE FUNCTION public.trigger_email_sequence(
  sequence_type text,
  target_user_id uuid,
  template_variables jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert email sequence log entry
  INSERT INTO public.email_sequence_logs (
    sequence_id,
    user_id,
    scheduled_for,
    variables,
    status
  ) 
  SELECT 
    es.id,
    target_user_id,
    now(),
    template_variables,
    'scheduled'
  FROM public.email_sequences es
  WHERE es.sequence_type = trigger_email_sequence.sequence_type
    AND es.is_active = true
  LIMIT 1;
END;
$$;