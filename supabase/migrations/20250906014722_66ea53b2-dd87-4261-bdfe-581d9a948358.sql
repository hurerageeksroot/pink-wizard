-- First, let's create the guaranteed_rewards_definition table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.guaranteed_rewards_definition (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  metric_key TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  reward_name TEXT NOT NULL,
  reward_description TEXT,
  shipping_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guaranteed_rewards_definition ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage guaranteed rewards"
ON public.guaranteed_rewards_definition
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view guaranteed rewards"
ON public.guaranteed_rewards_definition
FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Create reward_packs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reward_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for reward_packs
ALTER TABLE public.reward_packs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reward_packs
CREATE POLICY "Admins can manage reward packs"
ON public.reward_packs
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view active reward packs"
ON public.reward_packs
FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Now populate with sensible data

-- Insert badges
INSERT INTO public.badges_definition (name, description, icon_name, category, rarity, criteria, points_reward) VALUES
('First Contact', 'Added your first contact to the CRM', 'User', 'milestone', 'common', '{"event_type": "contact_added", "threshold": 1}', 50),
('Networking Ninja', 'Added 10 contacts in a single day', 'Users', 'achievement', 'rare', '{"event_type": "contacts_daily", "threshold": 10}', 200),
('Revenue Rockstar', 'Generated your first $1000 in revenue', 'DollarSign', 'milestone', 'epic', '{"event_type": "revenue_milestone", "threshold": 1000}', 500),
('Follow-up Master', 'Completed 25 follow-up activities', 'CheckCircle', 'achievement', 'uncommon', '{"event_type": "followups_completed", "threshold": 25}', 150),
('Networking Event Champion', 'Attended 5 networking events', 'Calendar', 'achievement', 'uncommon', '{"event_type": "events_attended", "threshold": 5}', 100),
('Social Media Guru', 'Connected with 50 people on social media', 'Share2', 'achievement', 'rare', '{"event_type": "social_connections", "threshold": 50}', 250),
('Pipeline Builder', 'Moved 20 contacts to warm status', 'TrendingUp', 'achievement', 'uncommon', '{"event_type": "warm_conversions", "threshold": 20}', 175),
('Deal Closer', 'Closed your first deal', 'Target', 'milestone', 'rare', '{"event_type": "deal_closed", "threshold": 1}', 300),
('Consistent Performer', 'Logged activities for 7 consecutive days', 'Zap', 'streak', 'uncommon', '{"event_type": "daily_streak", "threshold": 7}', 125),
('Monthly Champion', 'Achieved all monthly goals', 'Trophy', 'achievement', 'legendary', '{"event_type": "monthly_goals_complete", "threshold": 1}', 1000);

-- Insert variable reward configurations
INSERT INTO public.variable_rewards_config (event_type, base_probability, streak_multiplier, performance_multiplier) VALUES
('contact_added', 0.15, 1.3, 1.8),
('activity_completed', 0.10, 1.2, 1.5),
('networking_event', 0.25, 1.4, 2.0),
('deal_closed', 0.50, 1.5, 2.5),
('follow_up_completed', 0.12, 1.25, 1.6);

-- Insert reward packs
INSERT INTO public.reward_packs (name, description, event_type) VALUES
('Contact Rewards', 'Rewards for adding new contacts', 'contact_added'),
('Activity Rewards', 'Rewards for completing activities', 'activity_completed'),
('Networking Rewards', 'Special rewards for networking events', 'networking_event'),
('Deal Closing Rewards', 'Premium rewards for closing deals', 'deal_closed'),
('Follow-up Rewards', 'Rewards for consistent follow-ups', 'follow_up_completed');

-- Insert reward items for each pack
WITH reward_pack_ids AS (
  SELECT id, event_type FROM public.reward_packs
)
INSERT INTO public.reward_items (reward_pack_id, name, description, reward_type, reward_data, weight) 
SELECT 
  rp.id,
  item.name,
  item.description,
  item.reward_type::reward_type,
  item.reward_data::jsonb,
  item.weight
FROM reward_pack_ids rp
CROSS JOIN (
  VALUES
    ('contact_added', 'Bonus Points', 'Extra 25 points for your networking efforts', 'points', '{"amount": 25}', 5),
    ('contact_added', 'Coffee Credit', '$5 coffee shop gift card', 'gift_card', '{"amount": 5, "vendor": "coffee"}', 2),
    ('contact_added', 'Networking Badge', 'Special networking achievement badge', 'badge', '{"badge_id": "networking_pro"}', 1),
    
    ('activity_completed', 'Activity Bonus', 'Extra 15 points for staying active', 'points', '{"amount": 15}', 6),
    ('activity_completed', 'Productivity Tool', 'Free productivity app subscription (1 month)', 'subscription', '{"duration": 30, "type": "productivity"}', 1),
    
    ('networking_event', 'Event Bonus', 'Extra 50 points for networking', 'points', '{"amount": 50}', 4),
    ('networking_event', 'Business Card Credits', 'Free business card printing credits', 'service', '{"type": "business_cards", "quantity": 100}', 2),
    ('networking_event', 'LinkedIn Premium', '1 month LinkedIn Premium access', 'subscription', '{"duration": 30, "type": "linkedin"}', 1),
    
    ('deal_closed', 'Deal Bonus', 'Major bonus points for closing deals', 'points', '{"amount": 100}', 3),
    ('deal_closed', 'Celebration Dinner', '$50 restaurant gift card', 'gift_card', '{"amount": 50, "vendor": "restaurant"}', 2),
    ('deal_closed', 'Success Trophy', 'Physical trophy delivered to your office', 'physical', '{"item": "trophy", "shipping": true}', 1),
    
    ('follow_up_completed', 'Follow-up Bonus', 'Extra 20 points for consistency', 'points', '{"amount": 20}', 5),
    ('follow_up_completed', 'CRM Tools', 'Advanced CRM features unlock (1 month)', 'subscription', '{"duration": 30, "type": "crm_premium"}', 1)
) AS item(event_type, name, description, reward_type, reward_data, weight)
WHERE rp.event_type = item.event_type;

-- Insert guaranteed rewards
INSERT INTO public.guaranteed_rewards_definition (name, description, metric_key, threshold, reward_name, reward_description, shipping_required, sort_order) VALUES
('First Steps', 'Welcome reward for joining the platform', 'contacts_added', 1, 'Welcome Kit', 'Branded notebook and pen set', true, 1),
('Networking Rookie', 'Building your initial network', 'contacts_added', 10, 'Business Card Holder', 'Premium leather business card holder', true, 2),
('Network Builder', 'Expanding your professional network', 'contacts_added', 25, 'Networking Guide', 'Digital networking strategy guide + coffee tumbler', false, 3),
('Connection Master', 'Serious networking commitment', 'contacts_added', 50, 'Professional Portfolio', 'Leather portfolio with company logo', true, 4),
('Networking Elite', 'Top tier networking achievement', 'contacts_added', 100, 'Executive Gift Set', 'Premium pen set and desk accessories', true, 5),
('Activity Starter', 'Getting into the rhythm', 'activities_completed', 20, 'Productivity Planner', 'Custom daily planner with networking tips', true, 6),
('Consistent Performer', 'Regular activity completion', 'activities_completed', 50, 'Success Journal', 'Leather-bound success tracking journal', true, 7),
('Activity Champion', 'Exceptional activity commitment', 'activities_completed', 100, 'Smart Watch', 'Fitness tracker to keep you motivated', true, 8),
('Revenue Rookie', 'First revenue milestone', 'revenue_generated', 1000, 'Success Certificate', 'Framed achievement certificate', true, 9),
('Revenue Builder', 'Building momentum', 'revenue_generated', 5000, 'Business Book Set', 'Collection of top business and networking books', true, 10),
('Revenue Master', 'Significant revenue achievement', 'revenue_generated', 10000, 'Executive Briefcase', 'Premium leather briefcase', true, 11),
('Event Attendee', 'Networking event participation', 'events_attended', 5, 'Event Kit', 'Networking event survival kit with materials', true, 12),
('Event Enthusiast', 'Regular event attendance', 'events_attended', 15, 'Speaker Badge', 'Qualification for speaking opportunities at events', false, 13),
('Social Connector', 'Social media networking', 'social_connections', 25, 'Social Media Guide', 'Professional social media strategy guide', false, 14),
('Digital Networker', 'Online networking mastery', 'social_connections', 75, 'Online Course Access', 'Premium digital marketing course access', false, 15);