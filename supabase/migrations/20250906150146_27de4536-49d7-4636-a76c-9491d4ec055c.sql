-- Create user_trials table for trial management
CREATE TABLE public.user_trials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  trial_start_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trial_end_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own trials" 
ON public.user_trials 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage trials" 
ON public.user_trials 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Create index for performance
CREATE INDEX idx_user_trials_user_id ON public.user_trials(user_id);
CREATE INDEX idx_user_trials_status ON public.user_trials(status);
CREATE INDEX idx_user_trials_end_date ON public.user_trials(trial_end_at);

-- Update user_can_write function to include trial access
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

-- Create function to trigger email sequences
CREATE OR REPLACE FUNCTION public.trigger_email_sequence(
  event_name TEXT,
  target_user_id UUID,
  variables JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sequence_record RECORD;
  step_record RECORD;
  scheduled_time TIMESTAMP WITH TIME ZONE;
  user_email TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = target_user_id;
  
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Find active email sequence for this trigger
  SELECT * INTO sequence_record
  FROM public.email_sequences 
  WHERE trigger_event = event_name 
  AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Schedule all steps in the sequence
  FOR step_record IN 
    SELECT * FROM public.email_sequence_steps 
    WHERE sequence_id = sequence_record.id 
    AND is_active = true
    ORDER BY step_order ASC
  LOOP
    -- Calculate when to send this step
    scheduled_time := NOW() + 
      (step_record.delay_days || ' days')::INTERVAL + 
      (step_record.delay_hours || ' hours')::INTERVAL;
    
    -- Insert into email_sequence_logs
    INSERT INTO public.email_sequence_logs (
      sequence_id,
      step_id,
      user_id,
      scheduled_for,
      status
    ) VALUES (
      sequence_record.id,
      step_record.id,
      target_user_id,
      scheduled_time,
      'scheduled'
    );
  END LOOP;
  
  RETURN TRUE;
END;
$$;