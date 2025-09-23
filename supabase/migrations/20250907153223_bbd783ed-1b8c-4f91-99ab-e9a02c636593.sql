-- Create or replace the broadcast_challenge_email RPC function
CREATE OR REPLACE FUNCTION public.broadcast_challenge_email(p_template_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  participant_record RECORD;
  participant_count INTEGER := 0;
  email_vars jsonb;
  dashboard_url text := 'https://pink-wizard.com/';
  resources_url text := 'https://pink-wizard.com/resources';
  leaderboard_url text := 'https://pink-wizard.com/leaderboard';
  reset_password_url text := 'https://pink-wizard.com/reset-password';
  help_url text := 'https://pink-wizard.com/help';
BEGIN
  -- Only admins can broadcast emails
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Insufficient permissions to broadcast emails';
  END IF;

  -- Verify template exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.email_templates 
    WHERE template_key = p_template_key AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Template "%" not found or inactive', p_template_key;
  END IF;

  -- Get all active challenge participants with their profile info
  FOR participant_record IN
    SELECT 
      p.id as user_id,
      au.email,
      COALESCE(p.display_name, 'Participant') as display_name
    FROM public.user_challenge_progress ucp
    JOIN public.profiles p ON p.id = ucp.user_id
    JOIN auth.users au ON au.id = p.id
    WHERE ucp.is_active = true
      AND au.email IS NOT NULL
      AND au.email_confirmed_at IS NOT NULL
  LOOP
    participant_count := participant_count + 1;
    
    -- Build email variables for each participant
    email_vars := jsonb_build_object(
      'user_name', participant_record.display_name,
      'dashboard_url', dashboard_url,
      'resources_url', resources_url,
      'leaderboard_url', leaderboard_url,
      'reset_password_url', reset_password_url,
      'help_url', help_url
    );
    
    -- Insert email log entry for broadcast processing
    INSERT INTO public.email_logs (
      template_key,
      recipient_email,
      recipient_user_id,
      subject,
      status,
      metadata
    ) VALUES (
      p_template_key,
      participant_record.email,
      participant_record.user_id,
      'Broadcast: ' || p_template_key,
      'pending',
      jsonb_build_object(
        'broadcast', true,
        'variables', email_vars,
        'scheduled_at', now()
      )
    );
  END LOOP;

  -- Log the broadcast action
  INSERT INTO public.admin_audit_log (
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
      'timestamp', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'participant_count', participant_count,
    'template_key', p_template_key,
    'message', participant_count || ' emails scheduled for broadcast'
  );
END;
$$;