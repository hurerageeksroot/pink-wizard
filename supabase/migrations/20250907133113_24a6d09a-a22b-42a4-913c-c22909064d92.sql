-- Create comprehensive user data fetching function for emails
CREATE OR REPLACE FUNCTION public.get_user_email_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_data JSONB := '{}';
    profile_data RECORD;
    auth_user_data RECORD;
    user_email TEXT;
BEGIN
    -- Get user profile data
    SELECT display_name, company_name, location, avatar_url
    INTO profile_data
    FROM public.profiles 
    WHERE id = p_user_id;
    
    -- Get auth user data (email)
    SELECT email, raw_user_meta_data
    INTO auth_user_data
    FROM auth.users 
    WHERE id = p_user_id;
    
    user_email := auth_user_data.email;
    
    -- Build comprehensive user data object
    user_data := jsonb_build_object(
        'user_id', p_user_id,
        'user_name', COALESCE(
            profile_data.display_name,
            auth_user_data.raw_user_meta_data->>'display_name',
            auth_user_data.raw_user_meta_data->>'full_name',
            auth_user_data.raw_user_meta_data->>'name',
            CASE 
                WHEN user_email IS NOT NULL THEN split_part(user_email, '@', 1)
                ELSE 'there'
            END
        ),
        'user_email', COALESCE(user_email, ''),
        'company_name', COALESCE(profile_data.company_name, ''),
        'location', COALESCE(profile_data.location, ''),
        'avatar_url', COALESCE(profile_data.avatar_url, ''),
        'app_url', COALESCE(current_setting('app.base_url', true), 'https://idwkrddbdyakmpshsvtd.supabase.co')
    );
    
    RETURN user_data;
END;
$$;

-- Update the trigger_email_sequence function to use comprehensive user data
CREATE OR REPLACE FUNCTION public.trigger_email_sequence(
    event_name text, 
    target_user_id uuid, 
    variables jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  sequence_rec RECORD;
  step_rec RECORD;
  user_data JSONB;
  final_variables JSONB;
BEGIN
  -- Get comprehensive user data
  SELECT public.get_user_email_data(target_user_id) INTO user_data;
  
  -- Merge provided variables with user data (provided variables take precedence)
  final_variables := user_data || variables;
  
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
        final_variables
      );
    END LOOP;
  END LOOP;
END;
$$;

-- Create or update the process_scheduled_email_sequences function
CREATE OR REPLACE FUNCTION public.process_scheduled_email_sequences()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    email_rec RECORD;
    template_rec RECORD;
    user_data JSONB;
    final_variables JSONB;
    processed_count INTEGER := 0;
BEGIN
    -- Process emails that are scheduled to be sent now
    FOR email_rec IN 
        SELECT 
            esl.id,
            esl.user_id,
            esl.variables,
            ess.template_key,
            ess.subject_override
        FROM email_sequence_logs esl
        JOIN email_sequence_steps ess ON esl.step_id = ess.id
        WHERE esl.status = 'scheduled' 
        AND esl.scheduled_for <= NOW()
        ORDER BY esl.scheduled_for
        LIMIT 10 -- Process in batches to avoid timeouts
    LOOP
        -- Get fresh user data for each email
        SELECT public.get_user_email_data(email_rec.user_id) INTO user_data;
        
        -- Merge stored variables with fresh user data
        final_variables := user_data || COALESCE(email_rec.variables, '{}');
        
        -- Get template info
        SELECT * INTO template_rec
        FROM email_templates 
        WHERE template_key = email_rec.template_key 
        AND is_active = true
        LIMIT 1;
        
        IF template_rec.id IS NOT NULL THEN
            -- Create email log entry for sending
            INSERT INTO email_logs (
                template_key,
                recipient_email,
                recipient_user_id,
                subject,
                status,
                metadata
            ) VALUES (
                email_rec.template_key,
                (final_variables->>'user_email')::text,
                email_rec.user_id,
                COALESCE(email_rec.subject_override, template_rec.subject),
                'pending',
                jsonb_build_object('variables', final_variables)
            );
            
            -- Mark sequence log as processed
            UPDATE email_sequence_logs 
            SET status = 'sent', sent_at = NOW()
            WHERE id = email_rec.id;
            
            processed_count := processed_count + 1;
        ELSE
            -- Mark as failed if template not found
            UPDATE email_sequence_logs 
            SET status = 'failed', error_message = 'Template not found: ' || email_rec.template_key
            WHERE id = email_rec.id;
        END IF;
    END LOOP;
    
    RETURN processed_count;
END;
$$;