-- Add unique constraint to prevent duplicate welcome emails per user
ALTER TABLE email_logs 
ADD CONSTRAINT unique_user_welcome_email 
UNIQUE (recipient_user_id, template_key, status) 
WHERE template_key = 'welcome_email' AND status = 'sent';

-- Add index for better performance on email lookups
CREATE INDEX IF NOT EXISTS idx_email_logs_user_template 
ON email_logs (recipient_user_id, template_key, status) 
WHERE template_key = 'welcome_email';