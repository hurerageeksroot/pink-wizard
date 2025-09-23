-- Fix the process_scheduled_email_sequences function by adding the missing variables column
-- and updating the function to handle the corrected schema

-- First, add the missing variables column to email_sequence_logs
ALTER TABLE public.email_sequence_logs 
ADD COLUMN IF NOT EXISTS variables jsonb DEFAULT '{}'::jsonb;

-- Update the process_scheduled_email_sequences function to fix the column issue
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
            COALESCE(esl.variables, '{}'::jsonb) as variables,
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
                jsonb_build_object(
                    'variables', final_variables,
                    'template_id', template_rec.id
                )
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