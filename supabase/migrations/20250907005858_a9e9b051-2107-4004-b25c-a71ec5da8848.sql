-- Delete older duplicate emails, keeping only the most recent one per recipient
WITH duplicate_emails AS (
  SELECT 
    id,
    recipient_email,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY recipient_email 
      ORDER BY created_at DESC
    ) as row_num
  FROM email_logs 
  WHERE template_key = 'challenge_announcement' 
    AND status = 'pending'
)
DELETE FROM email_logs 
WHERE id IN (
  SELECT id 
  FROM duplicate_emails 
  WHERE row_num > 1
);