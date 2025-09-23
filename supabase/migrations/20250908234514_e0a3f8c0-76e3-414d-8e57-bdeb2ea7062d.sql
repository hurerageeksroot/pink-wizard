-- Drop existing function and recreate with first_name support
DROP FUNCTION IF EXISTS public.broadcast_challenge_email(text, text);

CREATE OR REPLACE FUNCTION public.broadcast_challenge_email(
  template_key_param text,
  subject_override_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_count INTEGER := 0;
  participant_record RECORD;
  first_name_value TEXT;
BEGIN
  -- Only admins can broadcast emails
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Insufficient permissions to broadcast emails';
  END IF;

  -- Get all active challenge participants with confirmed emails
  FOR participant_record IN
    SELECT 
      p.id as user_id,
      au.email,
      p.display_name,
      ucp.joined_at
    FROM public.user_challenge_progress ucp
    JOIN public.profiles p ON p.id = ucp.user_id
    JOIN auth.users au ON au.id = p.id
    WHERE ucp.is_active = true
      AND au.email_confirmed_at IS NOT NULL
      AND au.email IS NOT NULL
  LOOP
    -- Extract first name from display_name or use email prefix as fallback
    IF participant_record.display_name IS NOT NULL AND participant_record.display_name != '' THEN
      first_name_value := TRIM(SPLIT_PART(participant_record.display_name, ' ', 1));
    ELSE
      first_name_value := TRIM(SPLIT_PART(participant_record.email, '@', 1));
    END IF;
    
    -- Fallback to 'there' if still empty
    IF first_name_value IS NULL OR first_name_value = '' THEN
      first_name_value := 'there';
    END IF;

    -- Insert broadcast email into email_logs for processing
    INSERT INTO public.email_logs (
      template_key,
      recipient_email,
      recipient_user_id,
      subject,
      status,
      metadata,
      created_at
    ) VALUES (
      template_key_param,
      participant_record.email,
      participant_record.user_id,
      COALESCE(subject_override_param, 'Challenge Update'),
      'pending',
      jsonb_build_object(
        'broadcast_type', 'challenge_participants',
        'participant_since', participant_record.joined_at,
        'first_name', first_name_value,
        'user_name', first_name_value,
        'display_name', participant_record.display_name
      ),
      NOW()
    );
    
    email_count := email_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'emails_queued', email_count,
    'message', email_count || ' emails queued for active challenge participants'
  );
END;
$$;