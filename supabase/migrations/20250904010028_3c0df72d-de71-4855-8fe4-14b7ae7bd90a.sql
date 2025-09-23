-- Add function to trigger email sequences
CREATE OR REPLACE FUNCTION public.trigger_email_sequence(
  p_trigger_event TEXT,
  p_user_id UUID,
  p_user_email TEXT,
  p_variables JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  sequence_record RECORD;
  step_record RECORD;
  scheduled_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Find active email sequences for this trigger event
  FOR sequence_record IN 
    SELECT id, name, trigger_event, trigger_conditions
    FROM email_sequences 
    WHERE trigger_event = p_trigger_event 
    AND is_active = true
  LOOP
    -- Process each step in the sequence
    FOR step_record IN
      SELECT id, step_order, delay_days, delay_hours, template_key, subject_override
      FROM email_sequence_steps
      WHERE sequence_id = sequence_record.id
      AND is_active = true
      ORDER BY step_order ASC
    LOOP
      -- Calculate when this step should be sent
      scheduled_time := now() + 
        (step_record.delay_days || ' days')::interval + 
        (step_record.delay_hours || ' hours')::interval;
      
      -- Insert into email sequence logs for scheduling
      INSERT INTO email_sequence_logs (
        sequence_id,
        step_id,
        user_id,
        scheduled_for,
        status
      ) VALUES (
        sequence_record.id,
        step_record.id,
        p_user_id,
        scheduled_time,
        'scheduled'
      );
    END LOOP;
    
    RAISE NOTICE 'Triggered email sequence: % for user: %', sequence_record.name, p_user_id;
  END LOOP;
  
  RETURN TRUE;
END;
$function$;

-- Add function to process scheduled email sequences
CREATE OR REPLACE FUNCTION public.process_scheduled_email_sequences()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  pending_email RECORD;
  user_profile RECORD;
  template_record RECORD;
  user_variables JSONB;
  processed_count INTEGER := 0;
BEGIN
  -- Find emails that are scheduled and due to be sent
  FOR pending_email IN
    SELECT 
      esl.id as log_id,
      esl.user_id,
      esl.sequence_id,
      esl.step_id,
      esl.scheduled_for,
      ess.template_key,
      ess.subject_override,
      es.name as sequence_name
    FROM email_sequence_logs esl
    JOIN email_sequence_steps ess ON esl.step_id = ess.id
    JOIN email_sequences es ON esl.sequence_id = es.id
    WHERE esl.status = 'scheduled'
    AND esl.scheduled_for <= now()
    LIMIT 50  -- Process in batches
  LOOP
    -- Get user profile and email
    SELECT p.id, p.display_name, p.company_name, au.email
    INTO user_profile
    FROM profiles p
    LEFT JOIN auth.users au ON p.id = au.id
    WHERE p.id = pending_email.user_id;
    
    IF user_profile.email IS NOT NULL THEN
      -- Build variables for email template
      user_variables := jsonb_build_object(
        'user_name', COALESCE(user_profile.display_name, 'there'),
        'company_name', COALESCE(user_profile.company_name, ''),
        'sequence_name', pending_email.sequence_name
      );
      
      -- Call the send-email function
      PERFORM net.http_post(
        url := (SELECT current_setting('app.supabase_url') || '/functions/v1/send-email'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT current_setting('app.supabase_service_key'))
        ),
        body := jsonb_build_object(
          'templateKey', pending_email.template_key,
          'recipientEmail', user_profile.email,
          'recipientUserId', pending_email.user_id,
          'variables', user_variables
        )
      );
      
      -- Update the log status
      UPDATE email_sequence_logs
      SET status = 'sent', sent_at = now()
      WHERE id = pending_email.log_id;
      
      processed_count := processed_count + 1;
      
      RAISE NOTICE 'Sent sequence email: % to %', pending_email.template_key, user_profile.email;
    ELSE
      -- Mark as failed if no email found
      UPDATE email_sequence_logs
      SET status = 'failed', error_message = 'User email not found'
      WHERE id = pending_email.log_id;
    END IF;
  END LOOP;
  
  RETURN processed_count;
END;
$function$;

-- Add triggers for specific events
CREATE OR REPLACE FUNCTION public.trigger_user_signup_sequence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Trigger welcome email sequence when user profile is created
  PERFORM public.trigger_email_sequence(
    'user_signup',
    NEW.id,
    (SELECT email FROM auth.users WHERE id = NEW.id),
    jsonb_build_object('user_name', COALESCE(NEW.display_name, 'there'))
  );
  
  RETURN NEW;
END;
$function$;

-- Add trigger for contact added
CREATE OR REPLACE FUNCTION public.trigger_contact_added_sequence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Trigger contact added sequence
  PERFORM public.trigger_email_sequence(
    'contact_added',
    NEW.user_id,
    (SELECT email FROM auth.users WHERE id = NEW.user_id),
    jsonb_build_object(
      'contact_name', NEW.name,
      'contact_count', (SELECT COUNT(*) FROM contacts WHERE user_id = NEW.user_id)
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Add trigger for payment received
CREATE OR REPLACE FUNCTION public.trigger_payment_received_sequence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only trigger on successful payment
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    PERFORM public.trigger_email_sequence(
      'payment_received',
      NEW.user_id,
      NEW.email,
      jsonb_build_object(
        'amount', (NEW.amount::decimal / 100)::text,
        'currency', NEW.currency
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the actual triggers
DROP TRIGGER IF EXISTS trigger_user_signup_emails ON profiles;
CREATE TRIGGER trigger_user_signup_emails
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_user_signup_sequence();

DROP TRIGGER IF EXISTS trigger_contact_added_emails ON contacts;
CREATE TRIGGER trigger_contact_added_emails
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_contact_added_sequence();

DROP TRIGGER IF EXISTS trigger_payment_received_emails ON payments;
CREATE TRIGGER trigger_payment_received_emails
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_payment_received_sequence();