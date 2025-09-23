-- Update existing sarah@mobilebevpros.com to ensure they're not enrolled in challenge
UPDATE user_challenge_progress 
SET is_active = FALSE 
WHERE user_id = 'eb213c3a-7a1d-4ef2-a0da-dcc72375e282';

-- Remove any daily tasks that were auto-created for this user since they shouldn't be in challenge
DELETE FROM user_daily_tasks 
WHERE user_id = 'eb213c3a-7a1d-4ef2-a0da-dcc72375e282';