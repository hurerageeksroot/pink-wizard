-- Fix broadcast_challenge_email function to use correct field name
CREATE OR REPLACE FUNCTION public.broadcast_challenge_email(p_template_key text, p_subject_override text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      'challenge_name', challenge_info.name,
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
$function$