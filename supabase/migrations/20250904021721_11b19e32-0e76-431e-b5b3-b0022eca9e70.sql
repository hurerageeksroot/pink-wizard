-- First, let's clean up duplicate welcome emails, keeping only the earliest one per user
WITH duplicate_emails AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY recipient_user_id, template_key 
           ORDER BY created_at ASC
         ) as row_num
  FROM email_logs 
  WHERE template_key = 'welcome_email' 
    AND status = 'sent'
)
DELETE FROM email_logs 
WHERE id IN (
  SELECT id FROM duplicate_emails WHERE row_num > 1
);

-- Now create the unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_welcome_email_sent
ON email_logs (recipient_user_id, template_key) 
WHERE template_key = 'welcome_email' AND status = 'sent';

-- Add performance index
CREATE INDEX IF NOT EXISTS idx_email_logs_user_template 
ON email_logs (recipient_user_id, template_key, status);