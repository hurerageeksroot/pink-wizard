-- Immediately disable all active email sequences to stop the email spam
UPDATE email_sequences 
SET is_active = false 
WHERE is_active = true;

-- Also disable any scheduled email sequence logs that haven't been sent yet
UPDATE email_sequence_logs 
SET status = 'cancelled'
WHERE status = 'scheduled' AND sent_at IS NULL;