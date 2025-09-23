-- Trigger manual sync of challenge revenue for all users
UPDATE user_challenge_goals 
SET 
  revenue_current = (
    SELECT COALESCE(SUM(revenue_amount), 0) 
    FROM contacts 
    WHERE user_id = user_challenge_goals.user_id
  ),
  updated_at = now()
WHERE user_id IN (
  SELECT DISTINCT user_id FROM user_challenge_goals
);