-- Add partial unique index to prevent duplicate welcome emails per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_welcome_email_sent
ON email_logs (recipient_user_id, template_key) 
WHERE template_key = 'welcome_email' AND status = 'sent';

-- Add index for better performance on email lookups  
CREATE INDEX IF NOT EXISTS idx_email_logs_user_template 
ON email_logs (recipient_user_id, template_key, status) 
WHERE template_key = 'welcome_email';