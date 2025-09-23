-- Add missing triggers to automatically award badges when contacts/activities are created

-- Trigger for when contacts are inserted
CREATE OR REPLACE FUNCTION trigger_badge_check_on_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Call badge checking in a background process
  PERFORM check_and_award_badges(NEW.user_id, 'contact_added', jsonb_build_object('contact_id', NEW.id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for when contacts are updated (e.g., status changes to 'won')
CREATE OR REPLACE FUNCTION trigger_badge_check_on_contact_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check badges if status changed to 'won' or revenue was added
  IF OLD.status != NEW.status OR OLD.revenue_amount != NEW.revenue_amount THEN
    PERFORM check_and_award_badges(NEW.user_id, 'contact_updated', jsonb_build_object('contact_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to contacts table
DROP TRIGGER IF EXISTS award_badges_on_contact_insert ON contacts;
CREATE TRIGGER award_badges_on_contact_insert
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_badge_check_on_contact();

DROP TRIGGER IF EXISTS award_badges_on_contact_update ON contacts;
CREATE TRIGGER award_badges_on_contact_update
  AFTER UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_badge_check_on_contact_update();

-- Also add trigger for networking events
CREATE OR REPLACE FUNCTION trigger_badge_check_on_networking_event()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.user_id, 'networking_event', jsonb_build_object('event_id', NEW.id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS award_badges_on_networking_event ON networking_events;
CREATE TRIGGER award_badges_on_networking_event
  AFTER INSERT ON networking_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_badge_check_on_networking_event();