-- Fix the process_scheduled_email_sequences function to work without custom settings
CREATE OR REPLACE FUNCTION public.process_scheduled_email_sequences()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  pending_email RECORD;
  user_profile RECORD;
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
      
      -- Call the send-email function using the edge function
      PERFORM net.http_post(
        url := 'https://idwkrddbdyakmpshsvtd.supabase.co/functions/v1/send-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkd2tyZGRiZHlha21wc2hzdnRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY0ODY4MSwiZXhwIjoyMDcxMjI0NjgxfQ.UHdcc6vWsI_FdO_o-DuJOLDB_DLGW1r9W8IFoyy2v7k'
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

-- Create a cron job to process email sequences every 15 minutes  
SELECT cron.schedule(
  'process-email-sequences',
  '*/15 * * * *', -- every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://idwkrddbdyakmpshsvtd.supabase.co/functions/v1/process-email-sequences',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkd2tyZGRiZHlha21wc2hzdnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDg2ODEsImV4cCI6MjA3MTIyNDY4MX0.q_VRJrfAeha5q-qPC2ivJaFqX8yJyxjmRKFXnIuBObA"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);