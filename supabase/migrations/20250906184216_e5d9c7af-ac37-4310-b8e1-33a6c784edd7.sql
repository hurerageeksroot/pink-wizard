-- Fix looping issues by recreating the badge function with proper safeguards

-- Drop and recreate the function to avoid type conflicts
DROP FUNCTION IF EXISTS check_and_award_badges(uuid, text, jsonb);

-- Recreate with loop prevention and rate limiting
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
  recent_check BOOLEAN;
BEGIN
  -- Prevent rapid successive calls (rate limiting)
  SELECT EXISTS(
    SELECT 1 FROM user_points_ledger 
    WHERE user_id = p_user_id 
      AND activity_type = 'badge_check_throttle' 
      AND created_at > now() - interval '5 seconds'
  ) INTO recent_check;
  
  -- Exit early if checked recently to prevent loops
  IF recent_check THEN
    RETURN;
  END IF;
  
  -- Log this check to prevent rapid successive calls
  INSERT INTO user_points_ledger (user_id, activity_type, points_earned, description, metadata)
  VALUES (
    p_user_id, 
    'badge_check_throttle', 
    0, 
    'Badge check throttle',
    jsonb_build_object('event_type', p_event_type, 'timestamp', now())
  );
  
  -- Loop through all active badges to check criteria
  FOR badge_record IN 
    SELECT bd.id, bd.name, bd.criteria, bd.points_reward, bd.category
    FROM badges_definition bd 
    WHERE bd.is_active = true
    ORDER BY bd.id  -- Ensure consistent ordering
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
        
        -- Add points to user's ledger (mark to skip further badge checks)
        INSERT INTO user_points_ledger (user_id, activity_type, points_earned, description, metadata)
        VALUES (
          p_user_id, 
          'badge_earned', 
          badge_record.points_reward, 
          'Earned badge: ' || badge_record.name,
          jsonb_build_object(
            'badge_id', badge_record.id, 
            'badge_name', badge_record.name, 
            'skip_badge_check', true,
            'awarded_by_system', true
          )
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
          jsonb_build_object(
            'badge_id', badge_record.id, 
            'badge_name', badge_record.name, 
            'skip_badge_check', true,
            'awarded_by_system', true
          )
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
          jsonb_build_object(
            'badge_id', badge_record.id, 
            'badge_name', badge_record.name, 
            'skip_badge_check', true,
            'awarded_by_system', true
          )
        );
        
        RETURN QUERY SELECT badge_record.id, badge_record.name;
      END IF;
    END IF;
    
  END LOOP;
  
  -- Clean up old throttle entries (older than 1 hour)
  DELETE FROM user_points_ledger 
  WHERE activity_type = 'badge_check_throttle' 
    AND created_at < now() - interval '1 hour';
    
END;
$$;

-- Simplify triggers to be less aggressive
CREATE OR REPLACE FUNCTION trigger_badge_check_on_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check badges occasionally, not on every single insert
  -- Use a random chance to reduce frequency
  IF random() < 0.3 THEN -- Only 30% chance to trigger badge check
    PERFORM check_and_award_badges(NEW.user_id, 'contact_added', jsonb_build_object('contact_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Make update trigger more selective
CREATE OR REPLACE FUNCTION trigger_badge_check_on_contact_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check badges for significant status changes
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'won' THEN
    -- Always check when someone wins a deal
    PERFORM check_and_award_badges(NEW.user_id, 'contact_won', jsonb_build_object('contact_id', NEW.id));
  ELSIF OLD.revenue_amount IS DISTINCT FROM NEW.revenue_amount AND NEW.revenue_amount > OLD.revenue_amount THEN
    -- Check when revenue increases, but with throttling
    IF random() < 0.5 THEN
      PERFORM check_and_award_badges(NEW.user_id, 'revenue_updated', jsonb_build_object('contact_id', NEW.id));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;