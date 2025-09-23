-- Create badges and rewards system tables
CREATE TYPE badge_category AS ENUM ('milestone', 'consistency', 'performance', 'special');
CREATE TYPE reward_type AS ENUM ('badge', 'points', 'title', 'cosmetic');

-- Badges definition table
CREATE TABLE public.badges_definition (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT NOT NULL,
  category badge_category NOT NULL DEFAULT 'milestone',
  criteria JSONB NOT NULL DEFAULT '{}', -- {type: "contacts_added", threshold: 50}
  points_reward INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rarity TEXT DEFAULT 'common', -- common, rare, epic, legendary
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User badges earned
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges_definition(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress_data JSONB DEFAULT '{}', -- Store progress towards badge
  UNIQUE(user_id, badge_id)
);

-- Reward packs for variable rewards
CREATE TABLE public.reward_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_criteria JSONB NOT NULL DEFAULT '{}', -- {event: "contact_won", probability: 0.15}
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual reward items within packs
CREATE TABLE public.reward_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_pack_id UUID NOT NULL REFERENCES public.reward_packs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  reward_type reward_type NOT NULL,
  reward_data JSONB NOT NULL DEFAULT '{}', -- {badge_id: "...", points: 50, title: "Deal Closer"}
  weight INTEGER NOT NULL DEFAULT 1, -- For weighted random selection
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User rewards received
CREATE TABLE public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_item_id UUID NOT NULL REFERENCES public.reward_items(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  context_data JSONB DEFAULT '{}', -- Additional context about how it was earned
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE
);

-- Variable rewards configuration
CREATE TABLE public.variable_rewards_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- contact_won, activity_completed, etc.
  base_probability DECIMAL(3,3) NOT NULL DEFAULT 0.10, -- 10% base chance
  streak_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.5, -- 1.5x for streaks
  performance_multiplier DECIMAL(3,2) NOT NULL DEFAULT 2.0, -- 2x for high performers
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_type)
);

-- Enable RLS on all tables
ALTER TABLE public.badges_definition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variable_rewards_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges_definition
CREATE POLICY "Anyone can view active badges" ON public.badges_definition
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage badges" ON public.badges_definition
  FOR ALL USING (is_admin());

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' badges for leaderboard" ON public.user_badges
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id AND show_in_leaderboard = true)
  );

CREATE POLICY "Service role can manage user badges" ON public.user_badges
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for reward packs
CREATE POLICY "Anyone can view active reward packs" ON public.reward_packs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage reward packs" ON public.reward_packs
  FOR ALL USING (is_admin());

-- RLS Policies for reward items
CREATE POLICY "Anyone can view reward items" ON public.reward_items
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.reward_packs WHERE id = reward_pack_id AND is_active = true)
  );

CREATE POLICY "Admins can manage reward items" ON public.reward_items
  FOR ALL USING (is_admin());

-- RLS Policies for user_rewards
CREATE POLICY "Users can view their own rewards" ON public.user_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user rewards" ON public.user_rewards
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for variable_rewards_config
CREATE POLICY "Anyone can view reward config" ON public.variable_rewards_config
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage reward config" ON public.variable_rewards_config
  FOR ALL USING (is_admin());

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_badges_definition_updated_at
  BEFORE UPDATE ON public.badges_definition
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_reward_packs_updated_at
  BEFORE UPDATE ON public.reward_packs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_variable_rewards_config_updated_at
  BEFORE UPDATE ON public.variable_rewards_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert initial badges
INSERT INTO public.badges_definition (name, description, icon_name, category, criteria, points_reward, rarity) VALUES
('First Contact', 'Added your first contact to the system', 'UserPlus', 'milestone', '{"type": "contacts_added", "threshold": 1}', 10, 'common'),
('Network Builder', 'Added 25 contacts to your network', 'Users', 'milestone', '{"type": "contacts_added", "threshold": 25}', 50, 'rare'),
('Connection Master', 'Added 100 contacts to your network', 'Crown', 'milestone', '{"type": "contacts_added", "threshold": 100}', 200, 'epic'),

('First Win', 'Closed your first deal', 'Trophy', 'performance', '{"type": "contacts_won", "threshold": 1}', 25, 'rare'),
('Deal Closer', 'Closed 5 deals', 'Target', 'performance', '{"type": "contacts_won", "threshold": 5}', 100, 'epic'),
('Sales Legend', 'Closed 25 deals', 'Medal', 'performance', '{"type": "contacts_won", "threshold": 25}', 500, 'legendary'),

('Consistent Performer', 'Logged activities for 7 days straight', 'Calendar', 'consistency', '{"type": "daily_streak", "threshold": 7}', 75, 'rare'),
('Unstoppable Force', 'Logged activities for 30 days straight', 'Zap', 'consistency', '{"type": "daily_streak", "threshold": 30}', 300, 'epic'),

('Revenue Generator', 'Generated $10,000 in tracked revenue', 'DollarSign', 'performance', '{"type": "total_revenue", "threshold": 10000}', 250, 'epic'),
('Million Dollar Mindset', 'Generated $100,000 in tracked revenue', 'Gem', 'performance', '{"type": "total_revenue", "threshold": 100000}', 1000, 'legendary');

-- Insert initial reward packs
INSERT INTO public.reward_packs (name, description, trigger_criteria) VALUES
('Victory Celebration', 'Rewards for closing deals', '{"event": "contact_won", "probability": 0.15}'),
('Activity Streak', 'Rewards for consistent daily activities', '{"event": "daily_activity", "probability": 0.05}'),
('Network Growth', 'Rewards for adding new contacts', '{"event": "contact_added", "probability": 0.03}');

-- Insert reward items for Victory Celebration pack
INSERT INTO public.reward_items (reward_pack_id, name, description, reward_type, reward_data, weight)
SELECT rp.id, 'Bonus Points', 'Extra points for your achievement', 'points', '{"points": 50}', 5
FROM public.reward_packs rp WHERE rp.name = 'Victory Celebration'
UNION ALL
SELECT rp.id, 'Deal Maker Title', 'Earn the Deal Maker title', 'title', '{"title": "Deal Maker", "duration_days": 7}', 3
FROM public.reward_packs rp WHERE rp.name = 'Victory Celebration'
UNION ALL
SELECT rp.id, 'Victory Badge', 'Special victory badge', 'badge', '{"badge_name": "Victory Star", "temporary": true}', 2
FROM public.reward_packs rp WHERE rp.name = 'Victory Celebration';

-- Insert variable rewards config
INSERT INTO public.variable_rewards_config (event_type, base_probability, streak_multiplier, performance_multiplier) VALUES
('contact_won', 0.150, 1.5, 2.0),
('daily_activity', 0.050, 2.0, 1.5),
('contact_added', 0.030, 1.2, 1.3),
('revenue_milestone', 0.200, 1.8, 2.5);

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
    badge_result RECORD;
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
    
    -- Apply performance multiplier (simplified - could be more complex)
    IF user_performance > 1.5 THEN
        calculated_probability := calculated_probability * config_rec.performance_multiplier;
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