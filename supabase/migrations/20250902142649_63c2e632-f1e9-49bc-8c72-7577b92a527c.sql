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
  criteria JSONB NOT NULL DEFAULT '{}',
  points_reward INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rarity TEXT DEFAULT 'common',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User badges earned
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges_definition(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress_data JSONB DEFAULT '{}',
  UNIQUE(user_id, badge_id)
);

-- Reward packs for variable rewards
CREATE TABLE public.reward_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_criteria JSONB NOT NULL DEFAULT '{}',
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
  reward_data JSONB NOT NULL DEFAULT '{}',
  weight INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User rewards received
CREATE TABLE public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_item_id UUID NOT NULL REFERENCES public.reward_items(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  context_data JSONB DEFAULT '{}',
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE
);

-- Variable rewards configuration
CREATE TABLE public.variable_rewards_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  base_probability DECIMAL(3,3) NOT NULL DEFAULT 0.10,
  streak_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.5,
  performance_multiplier DECIMAL(3,2) NOT NULL DEFAULT 2.0,
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

-- RLS Policies
CREATE POLICY "Anyone can view active badges" ON public.badges_definition FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage badges" ON public.badges_definition FOR ALL USING (is_admin());

CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view others' badges for leaderboard" ON public.user_badges FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id AND show_in_leaderboard = true)
);
CREATE POLICY "Service role can manage user badges" ON public.user_badges FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can view active reward packs" ON public.reward_packs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage reward packs" ON public.reward_packs FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view reward items" ON public.reward_items FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.reward_packs WHERE id = reward_pack_id AND is_active = true)
);
CREATE POLICY "Admins can manage reward items" ON public.reward_items FOR ALL USING (is_admin());

CREATE POLICY "Users can view their own rewards" ON public.user_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage user rewards" ON public.user_rewards FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can view reward config" ON public.variable_rewards_config FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage reward config" ON public.variable_rewards_config FOR ALL USING (is_admin());

-- Add updated_at triggers
CREATE TRIGGER handle_badges_definition_updated_at BEFORE UPDATE ON public.badges_definition
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER handle_reward_packs_updated_at BEFORE UPDATE ON public.reward_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER handle_variable_rewards_config_updated_at BEFORE UPDATE ON public.variable_rewards_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
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

INSERT INTO public.reward_packs (name, description, trigger_criteria) VALUES
('Victory Celebration', 'Rewards for closing deals', '{"event": "contact_won", "probability": 0.15}'),
('Activity Streak', 'Rewards for consistent daily activities', '{"event": "daily_activity", "probability": 0.05}'),
('Network Growth', 'Rewards for adding new contacts', '{"event": "contact_added", "probability": 0.03}');

INSERT INTO public.variable_rewards_config (event_type, base_probability, streak_multiplier, performance_multiplier) VALUES
('contact_won', 0.150, 1.5, 2.0),
('daily_activity', 0.050, 2.0, 1.5),
('contact_added', 0.030, 1.2, 1.3),
('revenue_milestone', 0.200, 1.8, 2.5);