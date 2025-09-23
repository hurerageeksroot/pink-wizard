-- Fix security warning by setting proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;