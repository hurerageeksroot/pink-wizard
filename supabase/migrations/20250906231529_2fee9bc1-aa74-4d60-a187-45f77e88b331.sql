-- Fix revenue sync issue by updating challenge goals with correct revenue
UPDATE user_challenge_goals 
SET 
  revenue_current = (
    SELECT COALESCE(SUM(revenue_amount), 0) 
    FROM contacts 
    WHERE contacts.user_id = user_challenge_goals.user_id
  ),
  updated_at = now()
WHERE user_id = '8911c9ef-4c9f-43da-9162-b11087f25bfd';

-- Also create a trigger to keep revenue in sync automatically
CREATE OR REPLACE FUNCTION sync_challenge_revenue()
RETURNS TRIGGER AS $$
BEGIN
  -- Update challenge goals when contact revenue changes
  UPDATE user_challenge_goals 
  SET 
    revenue_current = (
      SELECT COALESCE(SUM(revenue_amount), 0) 
      FROM contacts 
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    ),
    updated_at = now()
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for revenue sync
DROP TRIGGER IF EXISTS sync_revenue_on_contact_change ON contacts;
CREATE TRIGGER sync_revenue_on_contact_change
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION sync_challenge_revenue();