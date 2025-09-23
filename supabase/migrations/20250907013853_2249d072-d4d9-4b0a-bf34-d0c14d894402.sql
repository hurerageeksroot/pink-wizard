-- Delete all failed emails (854 records)
DELETE FROM email_logs WHERE status = 'failed';

-- Delete all sent emails (12 records) if you want to clean those up too
DELETE FROM email_logs WHERE status = 'sent';

-- Verify what's left
-- Should show 0 records since there are currently no pending emails