-- Fix security warnings by adding proper search_path to functions

-- Fix trigger_badge_check_on_contact function
CREATE OR REPLACE FUNCTION trigger_badge_check_on_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Call badge checking in a background process
  PERFORM check_and_award_badges(NEW.user_id, 'contact_added', jsonb_build_object('contact_id', NEW.id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix trigger_badge_check_on_contact_update function
CREATE OR REPLACE FUNCTION trigger_badge_check_on_contact_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check badges if status changed to 'won' or revenue was added
  IF OLD.status != NEW.status OR OLD.revenue_amount != NEW.revenue_amount THEN
    PERFORM check_and_award_badges(NEW.user_id, 'contact_updated', jsonb_build_object('contact_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix trigger_badge_check_on_networking_event function
CREATE OR REPLACE FUNCTION trigger_badge_check_on_networking_event()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.user_id, 'networking_event', jsonb_build_object('event_id', NEW.id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;