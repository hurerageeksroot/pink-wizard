-- Manually check and award badges for the current user
-- First, let's see what badges should be awarded based on current data

-- Check contacts added (should trigger First Contact and Network Builder badges)
DO $$
DECLARE
  current_user_id UUID := '8911c9ef-4c9f-43da-9162-b11087f25bfd';
  contact_count INTEGER;
  first_contact_badge_id UUID;
  network_builder_badge_id UUID;
BEGIN
  -- Get contact count
  SELECT COUNT(*) INTO contact_count FROM contacts WHERE user_id = current_user_id;
  
  RAISE NOTICE 'User % has % contacts', current_user_id, contact_count;
  
  -- Get badge IDs
  SELECT id INTO first_contact_badge_id FROM badges_definition WHERE name = 'First Contact';
  SELECT id INTO network_builder_badge_id FROM badges_definition WHERE name = 'Network Builder';
  
  -- Award First Contact badge if user has at least 1 contact and doesn't have the badge
  IF contact_count >= 1 AND NOT EXISTS (
    SELECT 1 FROM user_badges WHERE user_id = current_user_id AND badge_id = first_contact_badge_id
  ) THEN
    INSERT INTO user_badges (user_id, badge_id, earned_at)
    VALUES (current_user_id, first_contact_badge_id, now());
    
    -- Award points
    INSERT INTO user_points_ledger (user_id, activity_type, points_earned, description, metadata)
    VALUES (current_user_id, 'badge_earned', 50, 'Earned First Contact badge', jsonb_build_object('badge_id', first_contact_badge_id));
    
    RAISE NOTICE 'Awarded First Contact badge';
  END IF;
  
  -- Award Network Builder badge if user has at least 25 contacts and doesn't have the badge
  IF contact_count >= 25 AND NOT EXISTS (
    SELECT 1 FROM user_badges WHERE user_id = current_user_id AND badge_id = network_builder_badge_id
  ) THEN
    INSERT INTO user_badges (user_id, badge_id, earned_at)
    VALUES (current_user_id, network_builder_badge_id, now());
    
    -- Award points
    INSERT INTO user_points_ledger (user_id, activity_type, points_earned, description, metadata)
    VALUES (current_user_id, 'badge_earned', 100, 'Earned Network Builder badge', jsonb_build_object('badge_id', network_builder_badge_id));
    
    RAISE NOTICE 'Awarded Network Builder badge';
  END IF;
END $$;