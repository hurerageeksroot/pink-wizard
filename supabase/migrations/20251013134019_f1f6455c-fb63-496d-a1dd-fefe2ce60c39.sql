-- Add activity_id column to user_metrics for linking metrics to activities
ALTER TABLE user_metrics 
ADD COLUMN IF NOT EXISTS activity_id uuid REFERENCES activities(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_user_metrics_activity_id ON user_metrics(activity_id);

-- Function to recalculate contact revenue from user_metrics
CREATE OR REPLACE FUNCTION recalculate_contact_revenue()
RETURNS TRIGGER AS $$
DECLARE
  contact_uuid uuid;
  total_revenue numeric;
BEGIN
  -- Get the contact_id from the affected row
  contact_uuid := COALESCE(NEW.contact_id, OLD.contact_id);
  
  -- Skip if no contact_id
  IF contact_uuid IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Only process if this is an event_value metric
  IF (TG_OP = 'DELETE' AND OLD.metric_name != 'event_value') OR
     (TG_OP IN ('INSERT', 'UPDATE') AND NEW.metric_name != 'event_value') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calculate total revenue for this contact
  SELECT COALESCE(SUM(value), 0)
  INTO total_revenue
  FROM user_metrics
  WHERE contact_id = contact_uuid
    AND metric_name = 'event_value';
  
  -- Update the contact's revenue_amount
  UPDATE contacts
  SET revenue_amount = total_revenue,
      updated_at = now()
  WHERE id = contact_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on INSERT/UPDATE/DELETE of revenue metrics
CREATE TRIGGER sync_contact_revenue_on_metrics_change
AFTER INSERT OR UPDATE OR DELETE ON user_metrics
FOR EACH ROW
EXECUTE FUNCTION recalculate_contact_revenue();

COMMENT ON FUNCTION recalculate_contact_revenue() IS 
  'Automatically recalculates contacts.revenue_amount as the sum of all event_value metrics for that contact';

-- Fix existing contacts with stale revenue_amount
UPDATE contacts c
SET revenue_amount = (
  SELECT COALESCE(SUM(um.value), 0)
  FROM user_metrics um
  WHERE um.contact_id = c.id
    AND um.metric_name = 'event_value'
)
WHERE EXISTS (
  SELECT 1 FROM user_metrics um
  WHERE um.contact_id = c.id
    AND um.metric_name = 'event_value'
);