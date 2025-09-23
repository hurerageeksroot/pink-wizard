-- Implement proper badge checking and awarding system
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id uuid, p_event_type text, p_event_data jsonb DEFAULT '{}')
RETURNS TABLE(awarded_badge_id uuid, badge_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  badge_record RECORD;
  user_count INTEGER;
  already_has_badge BOOLEAN;
BEGIN
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
        
        -- Add points to user's ledger
        INSERT INTO user_points_ledger (user_id, activity_type, points_earned, description, metadata)
        VALUES (
          p_user_id, 
          'badge_earned', 
          badge_record.points_reward, 
          'Earned badge: ' || badge_record.name,
          jsonb_build_object('badge_id', badge_record.id, 'badge_name', badge_record.name)
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
          jsonb_build_object('badge_id', badge_record.id, 'badge_name', badge_record.name)
        );
        
        RETURN QUERY SELECT badge_record.id, badge_record.name;
      END IF;
      
    ELSIF badge_record.criteria->>'type' = 'activities_completed' THEN
      -- Count completed activities
      SELECT COUNT(*) INTO user_count
      FROM activities a
      WHERE a.user_id = p_user_id AND a.completed_at IS NOT NULL;
      
      IF user_count >= (badge_record.criteria->>'threshold')::integer THEN
        INSERT INTO user_badges (user_id, badge_id, earned_at)
        VALUES (p_user_id, badge_record.id, now());
        
        INSERT INTO user_points_ledger (user_id, activity_type, points_earned, description, metadata)
        VALUES (
          p_user_id, 
          'badge_earned', 
          badge_record.points_reward, 
          'Earned badge: ' || badge_record.name,
          jsonb_build_object('badge_id', badge_record.id, 'badge_name', badge_record.name)
        );
        
        RETURN QUERY SELECT badge_record.id, badge_record.name;
      END IF;
      
    ELSIF badge_record.criteria->>'type' = 'networking_events' THEN
      -- Count networking events
      SELECT COUNT(*) INTO user_count
      FROM networking_events ne
      WHERE ne.user_id = p_user_id;
      
      IF user_count >= (badge_record.criteria->>'threshold')::integer THEN
        INSERT INTO user_badges (user_id, badge_id, earned_at)
        VALUES (p_user_id, badge_record.id, now());
        
        INSERT INTO user_points_ledger (user_id, activity_type, points_earned, description, metadata)
        VALUES (
          p_user_id, 
          'badge_earned', 
          badge_record.points_reward, 
          'Earned badge: ' || badge_record.name,
          jsonb_build_object('badge_id', badge_record.id, 'badge_name', badge_record.name)
        );
        
        RETURN QUERY SELECT badge_record.id, badge_record.name;
      END IF;
      
    ELSIF badge_record.criteria->>'type' = 'total_points' THEN
      -- Count total points earned
      SELECT COALESCE(SUM(points_earned), 0) INTO user_count
      FROM user_points_ledger upl
      WHERE upl.user_id = p_user_id;
      
      IF user_count >= (badge_record.criteria->>'threshold')::integer THEN
        INSERT INTO user_badges (user_id, badge_id, earned_at)
        VALUES (p_user_id, badge_record.id, now());
        
        INSERT INTO user_points_ledger (user_id, activity_type, points_earned, description, metadata)
        VALUES (
          p_user_id, 
          'badge_earned', 
          badge_record.points_reward, 
          'Earned badge: ' || badge_record.name,
          jsonb_build_object('badge_id', badge_record.id, 'badge_name', badge_record.name)
        );
        
        RETURN QUERY SELECT badge_record.id, badge_record.name;
      END IF;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Implement proper variable reward processing
CREATE OR REPLACE FUNCTION public.process_variable_reward(p_user_id uuid, p_event_type text, p_context_data jsonb DEFAULT '{}')
RETURNS TABLE(reward_earned boolean, reward_name text, reward_description text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reward_pack RECORD;
  reward_item RECORD;
  random_roll INTEGER;
  total_weight INTEGER;
  running_weight INTEGER;
  reward_probability NUMERIC;
BEGIN
  -- Find active reward packs that match the event type
  FOR reward_pack IN 
    SELECT rp.id, rp.name, rp.trigger_criteria
    FROM reward_packs rp 
    WHERE rp.is_active = true
    AND (
      rp.trigger_criteria->>'event_type' = p_event_type 
      OR rp.trigger_criteria->>'event_type' = 'any'
    )
  LOOP
    -- Check if we should trigger a reward (probability check)
    reward_probability := COALESCE((reward_pack.trigger_criteria->>'probability')::numeric, 0.1); -- Default 10% chance
    
    -- Generate random number between 0 and 1
    IF random() <= reward_probability THEN
      -- Calculate total weight of all items in this pack
      SELECT COALESCE(SUM(weight), 0) INTO total_weight
      FROM reward_items ri
      WHERE ri.reward_pack_id = reward_pack.id;
      
      -- Skip if no items
      IF total_weight = 0 THEN
        CONTINUE;
      END IF;
      
      -- Generate random number for weighted selection
      random_roll := floor(random() * total_weight) + 1;
      running_weight := 0;
      
      -- Find the selected reward item
      FOR reward_item IN 
        SELECT ri.id, ri.name, ri.description, ri.reward_type, ri.reward_data, ri.weight
        FROM reward_items ri
        WHERE ri.reward_pack_id = reward_pack.id
        ORDER BY ri.id
      LOOP
        running_weight := running_weight + reward_item.weight;
        
        IF random_roll <= running_weight THEN
          -- Award this reward to the user
          INSERT INTO user_rewards (
            user_id, 
            reward_item_id, 
            earned_at, 
            is_claimed
          ) VALUES (
            p_user_id, 
            reward_item.id, 
            now(), 
            false
          );
          
          -- Log points if it's a points reward
          IF reward_item.reward_type = 'points' THEN
            INSERT INTO user_points_ledger (
              user_id, 
              activity_type, 
              points_earned, 
              description, 
              metadata
            ) VALUES (
              p_user_id, 
              'variable_reward', 
              (reward_item.reward_data->>'points')::integer, 
              'Variable reward: ' || reward_item.name,
              jsonb_build_object('reward_item_id', reward_item.id, 'reward_type', reward_item.reward_type)
            );
          END IF;
          
          -- Return the earned reward
          RETURN QUERY SELECT true, reward_item.name, reward_item.description;
          
          -- Exit after awarding one reward
          RETURN;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  
  -- No reward earned
  RETURN QUERY SELECT false, NULL::text, NULL::text;
  RETURN;
END;
$$;