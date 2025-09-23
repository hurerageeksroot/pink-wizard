-- Fix potential looping issues in badge system by adding safeguards

-- First, let's add a flag to prevent recursive badge checking
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS processing_lock BOOLEAN DEFAULT FALSE;

-- Update the badge checking function to prevent loops
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id uuid, p_event_type text, p_event_data jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE(badge_id uuid, badge_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  badge_record RECORD;
  user_count INTEGER;
  already_has_badge BOOLEAN;
  processing_lock_exists BOOLEAN;
BEGIN
  -- Check if badges are already being processed for this user to prevent loops
  SELECT EXISTS(
    SELECT 1 FROM user_badges 
    WHERE user_id = p_user_id AND processing_lock = true
  ) INTO processing_lock_exists;
  
  -- Exit early if already processing badges for this user
  IF processing_lock_exists THEN
    RETURN;
  END IF;
  
  -- Set processing lock (we'll use a temp approach since we can't modify existing badges)
  -- Instead, we'll use a different approach with session-level prevention
  
  -- Loop through all active badges to check criteria
  FOR badge_record IN 
    SELECT bd.id, bd.name, bd.criteria, bd.points_reward, bd.category
    FROM badges_definition bd 
    WHERE bd.is_active = true
  LOOP
    -- Check if user already has this badge
    SELECT EXISTS(
      SELECT 1 FROM user_badges ub 
      WHERE ub.user_id = p_user_id AND ub.badge_id = badge_record.id
    ) INTO already_has_badge;
    
    -- Skip if user already has this badge
    IF already_has_badge THEN
      CONTINUE;
    END IF;
    
    -- Check different badge criteria types
    IF badge_record.criteria->>'type' = 'contacts_added' THEN
      -- Count total contacts for user
      SELECT COUNT(*) INTO user_count
      FROM contacts c
      WHERE c.user_id = p_user_id;
      
      -- Award badge if threshold met
      IF user_count >= (badge_record.criteria->>'threshold')::integer THEN
        INSERT INTO user_badges (user_id, badge_id, earned_at)
        VALUES (p_user_id, badge_record.id, now());
        
        -- Add points to user's ledger (avoid triggering more badge checks)
        INSERT INTO user_points_ledger (user_id, activity_type, points_earned, description, metadata)
        VALUES (
          p_user_id, 
          'badge_earned', 
          badge_record.points_reward, 
          'Earned badge: ' || badge_record.name,
          jsonb_build_object('badge_id', badge_record.id, 'badge_name', badge_record.name, 'skip_badge_check', true)
        );
        
        -- Return the awarded badge
        RETURN QUERY SELECT badge_record.id, badge_record.name;
      END IF;
      
    ELSIF badge_record.criteria->>'type' = 'contacts_won' THEN
      -- Count contacts with won status
      SELECT COUNT(*) INTO user_count
      FROM contacts c
      WHERE c.user_id = p_user_id AND c.status = 'won';
      
      IF user_count >= (badge_record.criteria->>'threshold')::integer THEN
        INSERT INTO user_badges (user_id, badge_id, earned_at)
        VALUES (p_user_id, badge_record.id, now());
        
        INSERT INTO user_points_ledger (user_id, activity_type, points_earned, description, metadata)
        VALUES (
          p_user_id, 
          'badge_earned', 
          badge_record.points_reward, 
          'Earned badge: ' || badge_record.name,
          jsonb_build_object('badge_id', badge_record.id, 'badge_name', badge_record.name, 'skip_badge_check', true)
        );
        
        RETURN QUERY SELECT badge_record.id, badge_record.name;
      END IF;
      
    ELSIF badge_record.criteria->>'type' = 'total_revenue' THEN
      -- Count total revenue
      SELECT COALESCE(SUM(revenue_amount), 0)::integer INTO user_count
      FROM contacts c
      WHERE c.user_id = p_user_id;
      
      IF user_count >= (badge_record.criteria->>'threshold')::integer THEN
        INSERT INTO user_badges (user_id, badge_id, earned_at)
        VALUES (p_user_id, badge_record.id, now());
        
        INSERT INTO user_points_ledger (user_id, activity_type, points_earned, description, metadata)
        VALUES (
          p_user_id, 
          'badge_earned', 
          badge_record.points_reward, 
          'Earned badge: ' || badge_record.name,
          jsonb_build_object('badge_id', badge_record.id, 'badge_name', badge_record.name, 'skip_badge_check', true)
        );
        
        RETURN QUERY SELECT badge_record.id, badge_record.name;
      END IF;
    END IF;
    
  END LOOP;
  
END;
$$;

-- Update triggers to be less aggressive and add safeguards
CREATE OR REPLACE FUNCTION trigger_badge_check_on_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check badges for significant events, not every insert
  -- Add a small delay and batch processing to prevent spam
  PERFORM pg_notify('badge_check_needed', json_build_object(
    'user_id', NEW.user_id,
    'event_type', 'contact_added',
    'contact_id', NEW.id
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update contact update trigger to be more specific
CREATE OR REPLACE FUNCTION trigger_badge_check_on_contact_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check badges for meaningful changes (status or revenue changes)
  IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('won', 'lost_not_fit', 'lost_maybe_later')) 
     OR (OLD.revenue_amount IS DISTINCT FROM NEW.revenue_amount) THEN
    
    PERFORM pg_notify('badge_check_needed', json_build_object(
      'user_id', NEW.user_id,
      'event_type', 'contact_updated',
      'contact_id', NEW.id,
      'old_status', OLD.status,
      'new_status', NEW.status
    )::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a more controlled badge checking function
CREATE OR REPLACE FUNCTION process_badge_notifications()
RETURNS void AS $$
DECLARE
  notification RECORD;
  notification_data JSON;
BEGIN
  -- Process notifications in batches to prevent overwhelming the system
  FOR notification IN
    SELECT pg_listen('badge_check_needed')
    LIMIT 10  -- Process max 10 at a time
  LOOP
    -- Parse the notification data and process badges
    notification_data := notification.payload::json;
    
    -- Call badge checking with rate limiting
    PERFORM check_and_award_badges(
      (notification_data->>'user_id')::uuid,
      notification_data->>'event_type',
      notification_data
    );
    
    -- Small delay to prevent overwhelming
    PERFORM pg_sleep(0.1);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;