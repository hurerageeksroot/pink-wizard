-- Skip table creation if it already exists, just add triggers and functions
-- Function to trigger email sequences from database events
CREATE OR REPLACE FUNCTION trigger_email_sequence(
  event_name TEXT,
  target_user_id UUID,
  variables JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sequence_rec RECORD;
  step_rec RECORD;
BEGIN
  -- Find active sequences for this event
  FOR sequence_rec IN 
    SELECT * FROM email_sequences 
    WHERE trigger_event = event_name AND is_active = true
  LOOP
    -- Create sequence logs for each step
    FOR step_rec IN 
      SELECT * FROM email_sequence_steps 
      WHERE sequence_id = sequence_rec.id AND is_active = true
      ORDER BY step_order
    LOOP
      INSERT INTO email_sequence_logs (
        sequence_id,
        step_id,
        user_id,
        scheduled_for,
        status,
        variables
      ) VALUES (
        sequence_rec.id,
        step_rec.id,
        target_user_id,
        NOW() + (step_rec.delay_days || ' days')::interval + (step_rec.delay_hours || ' hours')::interval,
        'scheduled',
        variables
      );
    END LOOP;
  END LOOP;
END;
$$;

-- Trigger for challenge start (when user joins challenge)
CREATE OR REPLACE FUNCTION trigger_challenge_start_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Only trigger for new active challenge progress
  IF NEW.is_active = true AND (OLD IS NULL OR OLD.is_active = false) THEN
    -- Get user profile info
    SELECT display_name, id INTO user_profile
    FROM profiles WHERE id = NEW.user_id;
    
    -- Trigger challenge start sequence
    PERFORM trigger_email_sequence(
      'challenge_start',
      NEW.user_id,
      jsonb_build_object(
        'user_name', COALESCE(user_profile.display_name, 'there'),
        'challenge_start_date', NEW.joined_at::date
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_challenge_start ON user_challenge_progress;
CREATE TRIGGER on_challenge_start
  AFTER INSERT OR UPDATE ON user_challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION trigger_challenge_start_email();

-- Trigger for challenge completion
CREATE OR REPLACE FUNCTION trigger_challenge_complete_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
  challenge_config RECORD;
BEGIN
  -- Check if challenge was just completed (75+ days or 100% progress)
  IF NEW.total_days_completed >= 75 OR NEW.overall_progress >= 100 THEN
    IF OLD IS NULL OR (OLD.total_days_completed < 75 AND OLD.overall_progress < 100) THEN
      -- Get user profile info
      SELECT display_name INTO user_profile
      FROM profiles WHERE id = NEW.user_id;
      
      -- Get challenge config
      SELECT * INTO challenge_config
      FROM challenge_config WHERE is_active = true LIMIT 1;
      
      -- Trigger challenge complete sequence
      PERFORM trigger_email_sequence(
        'challenge_complete',
        NEW.user_id,
        jsonb_build_object(
          'user_name', COALESCE(user_profile.display_name, 'there'),
          'completion_date', NEW.updated_at::date,
          'total_days', NEW.total_days_completed,
          'final_progress', NEW.overall_progress
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_challenge_complete ON user_challenge_progress;
CREATE TRIGGER on_challenge_complete
  AFTER UPDATE ON user_challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION trigger_challenge_complete_email();

-- Update broadcast function to send emails directly
CREATE OR REPLACE FUNCTION broadcast_challenge_email(
  p_template_key TEXT,
  p_subject_override TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  participant_record RECORD;
  participant_count INTEGER := 0;
  email_variables JSONB;
  challenge_info RECORD;
BEGIN
  -- Only admins can broadcast emails
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Insufficient permissions to broadcast emails';
  END IF;

  -- Get active challenge info
  SELECT * INTO challenge_info 
  FROM challenge_config 
  WHERE is_active = true 
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active challenge found';
  END IF;

  -- Send emails directly to each participant
  FOR participant_record IN
    SELECT p.id, p.display_name, au.email
    FROM user_challenge_progress ucp
    JOIN profiles p ON p.id = ucp.user_id
    JOIN auth.users au ON au.id = p.id
    WHERE ucp.is_active = true
      AND au.email IS NOT NULL
  LOOP
    participant_count := participant_count + 1;
    
    -- Prepare variables for this participant
    email_variables := jsonb_build_object(
      'user_name', COALESCE(participant_record.display_name, 'there'),
      'challenge_name', challenge_info.title,
      'challenge_day', challenge_info.current_day,
      'total_days', challenge_info.total_days
    );
    
    -- Insert into email_logs directly for immediate processing
    INSERT INTO email_logs (
      template_key,
      recipient_email,
      recipient_user_id,
      subject,
      status,
      metadata,
      idempotency_key
    ) VALUES (
      p_template_key,
      participant_record.email,
      participant_record.id,
      COALESCE(p_subject_override, 'Challenge Update'),
      'pending',
      email_variables,
      'broadcast_' || p_template_key || '_' || participant_record.id || '_' || extract(epoch from now())
    );
    
  END LOOP;

  -- Log the broadcast in admin audit log
  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    resource_type,
    details
  ) VALUES (
    auth.uid(),
    'EMAIL_BROADCAST',
    'challenge_email',
    jsonb_build_object(
      'template_key', p_template_key,
      'participant_count', participant_count,
      'subject_override', p_subject_override
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'participant_count', participant_count,
    'template_key', p_template_key,
    'message', format('Email broadcast queued for %s challenge participants', participant_count)
  );
END;
$$;

-- Function to get admin emails for notifications
CREATE OR REPLACE FUNCTION get_admin_emails()
RETURNS TEXT[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(au.email)
  FROM user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  WHERE ur.role = 'admin'
    AND au.email IS NOT NULL;
$$;