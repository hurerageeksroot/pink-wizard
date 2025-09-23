-- Create function to award badges based on criteria
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id UUID, p_event_type TEXT, p_event_data JSONB DEFAULT '{}')
RETURNS TABLE(awarded_badge_id UUID, badge_name TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    badge_rec RECORD;
    user_stats RECORD;
    awarded_badges UUID[] := '{}';
BEGIN
    -- Get user stats for comparison
    SELECT 
        COUNT(*) FILTER (WHERE c.status = 'won') as contacts_won,
        COUNT(*) as total_contacts,
        COALESCE(SUM(CAST(um.value AS NUMERIC)) FILTER (WHERE um.metric_name = 'event_value'), 0) as total_revenue,
        COALESCE(MAX(ucp.current_streak), 0) as current_streak
    INTO user_stats
    FROM public.contacts c
    LEFT JOIN public.user_metrics um ON um.user_id = p_user_id
    LEFT JOIN public.user_challenge_progress ucp ON ucp.user_id = p_user_id
    WHERE c.user_id = p_user_id;
    
    -- Check each active badge definition
    FOR badge_rec IN 
        SELECT bd.* FROM public.badges_definition bd 
        WHERE bd.is_active = true 
        AND NOT EXISTS(SELECT 1 FROM public.user_badges ub WHERE ub.user_id = p_user_id AND ub.badge_id = bd.id)
    LOOP
        -- Check if user meets criteria for this badge
        CASE 
            WHEN badge_rec.criteria->>'type' = 'contacts_added' AND 
                 user_stats.total_contacts >= (badge_rec.criteria->>'threshold')::INTEGER THEN
                -- Award the badge
                INSERT INTO public.user_badges (user_id, badge_id) 
                VALUES (p_user_id, badge_rec.id)
                ON CONFLICT (user_id, badge_id) DO NOTHING;
                awarded_badges := array_append(awarded_badges, badge_rec.id);
                
            WHEN badge_rec.criteria->>'type' = 'contacts_won' AND 
                 user_stats.contacts_won >= (badge_rec.criteria->>'threshold')::INTEGER THEN
                INSERT INTO public.user_badges (user_id, badge_id) 
                VALUES (p_user_id, badge_rec.id)
                ON CONFLICT (user_id, badge_id) DO NOTHING;
                awarded_badges := array_append(awarded_badges, badge_rec.id);
                
            WHEN badge_rec.criteria->>'type' = 'total_revenue' AND 
                 user_stats.total_revenue >= (badge_rec.criteria->>'threshold')::NUMERIC THEN
                INSERT INTO public.user_badges (user_id, badge_id) 
                VALUES (p_user_id, badge_rec.id)
                ON CONFLICT (user_id, badge_id) DO NOTHING;
                awarded_badges := array_append(awarded_badges, badge_rec.id);
                
            WHEN badge_rec.criteria->>'type' = 'daily_streak' AND 
                 user_stats.current_streak >= (badge_rec.criteria->>'threshold')::INTEGER THEN
                INSERT INTO public.user_badges (user_id, badge_id) 
                VALUES (p_user_id, badge_rec.id)
                ON CONFLICT (user_id, badge_id) DO NOTHING;
                awarded_badges := array_append(awarded_badges, badge_rec.id);
        END CASE;
    END LOOP;
    
    -- Return awarded badges
    RETURN QUERY
    SELECT bd.id, bd.name
    FROM public.badges_definition bd
    WHERE bd.id = ANY(awarded_badges);
END;
$$;

-- Create function to process variable rewards  
CREATE OR REPLACE FUNCTION public.process_variable_reward(p_user_id UUID, p_event_type TEXT, p_context_data JSONB DEFAULT '{}')
RETURNS TABLE(reward_earned BOOLEAN, reward_name TEXT, reward_description TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    config_rec RECORD;
    pack_rec RECORD;
    reward_rec RECORD;
    calculated_probability DECIMAL;
    random_roll DECIMAL;
    user_performance DECIMAL := 1.0;
    user_streak INTEGER := 0;
    selected_reward_id UUID;
    total_weight INTEGER;
    current_weight INTEGER := 0;
    target_weight INTEGER;
BEGIN
    -- Get configuration for this event type
    SELECT * INTO config_rec 
    FROM public.variable_rewards_config vrc 
    WHERE vrc.event_type = p_event_type AND vrc.is_active = true;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Get user performance metrics
    SELECT COALESCE(ucp.current_streak, 0) INTO user_streak
    FROM public.user_challenge_progress ucp 
    WHERE ucp.user_id = p_user_id;
    
    -- Calculate final probability
    calculated_probability := config_rec.base_probability;
    
    -- Apply streak multiplier if user has a streak
    IF user_streak > 3 THEN
        calculated_probability := calculated_probability * config_rec.streak_multiplier;
    END IF;
    
    -- Cap at 50% max probability
    calculated_probability := LEAST(calculated_probability, 0.50);
    
    -- Roll for reward
    random_roll := random();
    
    IF random_roll > calculated_probability THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Find appropriate reward pack
    SELECT * INTO pack_rec 
    FROM public.reward_packs rp 
    WHERE rp.is_active = true 
    AND rp.trigger_criteria->>'event' = p_event_type
    ORDER BY random() 
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Get total weight for weighted selection
    SELECT SUM(weight) INTO total_weight
    FROM public.reward_items ri 
    WHERE ri.reward_pack_id = pack_rec.id;
    
    -- Select random reward based on weight
    target_weight := floor(random() * total_weight) + 1;
    
    FOR reward_rec IN 
        SELECT * FROM public.reward_items ri 
        WHERE ri.reward_pack_id = pack_rec.id
        ORDER BY ri.id
    LOOP
        current_weight := current_weight + reward_rec.weight;
        IF current_weight >= target_weight THEN
            selected_reward_id := reward_rec.id;
            EXIT;
        END IF;
    END LOOP;
    
    -- Award the reward
    INSERT INTO public.user_rewards (user_id, reward_item_id, context_data)
    VALUES (p_user_id, selected_reward_id, p_context_data);
    
    -- Return success
    RETURN QUERY 
    SELECT true, reward_rec.name, reward_rec.description;
END;
$$;