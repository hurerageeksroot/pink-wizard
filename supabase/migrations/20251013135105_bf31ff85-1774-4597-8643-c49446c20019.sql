-- Drop existing trigger/function if they exist (cleanup)
DROP TRIGGER IF EXISTS sync_contact_revenue_on_metrics_change ON user_metrics;
DROP FUNCTION IF EXISTS recalculate_contact_revenue() CASCADE;

-- Recreate function with explicit security settings
CREATE OR REPLACE FUNCTION public.recalculate_contact_revenue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  
  -- Only process event_value metrics
  IF (TG_OP = 'DELETE' AND OLD.metric_name != 'event_value') OR
     (TG_OP IN ('INSERT', 'UPDATE') AND NEW.metric_name != 'event_value') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calculate total revenue for this contact
  SELECT COALESCE(SUM(value), 0)
  INTO total_revenue
  FROM public.user_metrics
  WHERE contact_id = contact_uuid
    AND metric_name = 'event_value';
  
  -- Update the contact's revenue_amount
  UPDATE public.contacts
  SET revenue_amount = total_revenue,
      updated_at = now()
  WHERE id = contact_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger (simplified syntax)
CREATE TRIGGER sync_contact_revenue_on_metrics_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_contact_revenue();

-- Add comment for documentation
COMMENT ON FUNCTION public.recalculate_contact_revenue() IS 
  'Automatically recalculates contacts.revenue_amount as the sum of all event_value metrics for that contact';