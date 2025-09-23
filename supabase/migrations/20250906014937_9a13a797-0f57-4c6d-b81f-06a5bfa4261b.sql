-- Insert badges with correct enum values
INSERT INTO public.badges_definition (name, description, icon_name, category, rarity, criteria, points_reward) 
SELECT * FROM (VALUES
  ('First Contact', 'Added your first contact to the CRM', 'User', 'milestone', 'common', '{"event_type": "contact_added", "threshold": 1}'::jsonb, 50),
  ('Networking Ninja', 'Added 10 contacts in a single day', 'Users', 'performance', 'rare', '{"event_type": "contacts_daily", "threshold": 10}'::jsonb, 200),
  ('Revenue Rockstar', 'Generated your first $1000 in revenue', 'DollarSign', 'milestone', 'epic', '{"event_type": "revenue_milestone", "threshold": 1000}'::jsonb, 500),
  ('Follow-up Master', 'Completed 25 follow-up activities', 'CheckCircle', 'performance', 'uncommon', '{"event_type": "followups_completed", "threshold": 25}'::jsonb, 150),
  ('Networking Event Champion', 'Attended 5 networking events', 'Calendar', 'performance', 'uncommon', '{"event_type": "events_attended", "threshold": 5}'::jsonb, 100),
  ('Social Media Guru', 'Connected with 50 people on social media', 'Share2', 'performance', 'rare', '{"event_type": "social_connections", "threshold": 50}'::jsonb, 250),
  ('Pipeline Builder', 'Moved 20 contacts to warm status', 'TrendingUp', 'performance', 'uncommon', '{"event_type": "warm_conversions", "threshold": 20}'::jsonb, 175),
  ('Deal Closer', 'Closed your first deal', 'Target', 'milestone', 'rare', '{"event_type": "deal_closed", "threshold": 1}'::jsonb, 300),
  ('Consistent Performer', 'Logged activities for 7 consecutive days', 'Zap', 'consistency', 'uncommon', '{"event_type": "daily_streak", "threshold": 7}'::jsonb, 125),
  ('Monthly Champion', 'Achieved all monthly goals', 'Trophy', 'special', 'legendary', '{"event_type": "monthly_goals_complete", "threshold": 1}'::jsonb, 1000)
) AS new_badges(name, description, icon_name, category, rarity, criteria, points_reward)
WHERE NOT EXISTS (
  SELECT 1 FROM public.badges_definition bd WHERE bd.name = new_badges.name
);

-- Insert variable reward configurations if they don't exist
INSERT INTO public.variable_rewards_config (event_type, base_probability, streak_multiplier, performance_multiplier) 
SELECT * FROM (VALUES
  ('contact_added', 0.15, 1.3, 1.8),
  ('activity_completed', 0.10, 1.2, 1.5),
  ('networking_event', 0.25, 1.4, 2.0),
  ('deal_closed', 0.50, 1.5, 2.5),
  ('follow_up_completed', 0.12, 1.25, 1.6)
) AS new_configs(event_type, base_probability, streak_multiplier, performance_multiplier)
WHERE NOT EXISTS (
  SELECT 1 FROM public.variable_rewards_config vrc WHERE vrc.event_type = new_configs.event_type
);

-- Create guaranteed_rewards_definition table if it doesn't exist
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

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'guaranteed_rewards_definition' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.guaranteed_rewards_definition ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'guaranteed_rewards_definition' 
    AND policyname = 'Admins can manage guaranteed rewards'
  ) THEN
    CREATE POLICY "Admins can manage guaranteed rewards"
    ON public.guaranteed_rewards_definition
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'guaranteed_rewards_definition' 
    AND policyname = 'Authenticated users can view guaranteed rewards'
  ) THEN
    CREATE POLICY "Authenticated users can view guaranteed rewards"
    ON public.guaranteed_rewards_definition
    FOR SELECT
    USING (is_active = true AND auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Insert guaranteed rewards if they don't exist
INSERT INTO public.guaranteed_rewards_definition (name, description, metric_key, threshold, reward_name, reward_description, shipping_required, sort_order) 
SELECT * FROM (VALUES
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
  ('Digital Networker', 'Online networking mastery', 'social_connections', 75, 'Online Course Access', 'Premium digital marketing course access', false, 15)
) AS new_rewards(name, description, metric_key, threshold, reward_name, reward_description, shipping_required, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.guaranteed_rewards_definition grd WHERE grd.name = new_rewards.name
);