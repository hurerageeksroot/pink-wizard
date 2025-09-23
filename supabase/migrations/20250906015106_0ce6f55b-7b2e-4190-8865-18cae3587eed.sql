-- Add unique constraints if they don't exist
DO $$ 
BEGIN
  -- Add unique constraint on badges_definition.name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'badges_definition_name_key' 
    AND conrelid = 'public.badges_definition'::regclass
  ) THEN
    ALTER TABLE public.badges_definition ADD CONSTRAINT badges_definition_name_key UNIQUE (name);
  END IF;
  
  -- Add unique constraint on variable_rewards_config.event_type if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'variable_rewards_config_event_type_key' 
    AND conrelid = 'public.variable_rewards_config'::regclass
  ) THEN
    ALTER TABLE public.variable_rewards_config ADD CONSTRAINT variable_rewards_config_event_type_key UNIQUE (event_type);
  END IF;
END $$;

-- Insert badges with proper enum casting and conflict handling
INSERT INTO public.badges_definition (name, description, icon_name, category, rarity, criteria, points_reward) 
VALUES
  ('First Contact', 'Added your first contact to the CRM', 'User', 'milestone'::badge_category, 'common', '{"event_type": "contact_added", "threshold": 1}'::jsonb, 50),
  ('Networking Ninja', 'Added 10 contacts in a single day', 'Users', 'performance'::badge_category, 'rare', '{"event_type": "contacts_daily", "threshold": 10}'::jsonb, 200),
  ('Revenue Rockstar', 'Generated your first $1000 in revenue', 'DollarSign', 'milestone'::badge_category, 'epic', '{"event_type": "revenue_milestone", "threshold": 1000}'::jsonb, 500),
  ('Follow-up Master', 'Completed 25 follow-up activities', 'CheckCircle', 'performance'::badge_category, 'uncommon', '{"event_type": "followups_completed", "threshold": 25}'::jsonb, 150),
  ('Networking Event Champion', 'Attended 5 networking events', 'Calendar', 'performance'::badge_category, 'uncommon', '{"event_type": "events_attended", "threshold": 5}'::jsonb, 100),
  ('Social Media Guru', 'Connected with 50 people on social media', 'Share2', 'performance'::badge_category, 'rare', '{"event_type": "social_connections", "threshold": 50}'::jsonb, 250),
  ('Pipeline Builder', 'Moved 20 contacts to warm status', 'TrendingUp', 'performance'::badge_category, 'uncommon', '{"event_type": "warm_conversions", "threshold": 20}'::jsonb, 175),
  ('Deal Closer', 'Closed your first deal', 'Target', 'milestone'::badge_category, 'rare', '{"event_type": "deal_closed", "threshold": 1}'::jsonb, 300),
  ('Consistent Performer', 'Logged activities for 7 consecutive days', 'Zap', 'consistency'::badge_category, 'uncommon', '{"event_type": "daily_streak", "threshold": 7}'::jsonb, 125),
  ('Monthly Champion', 'Achieved all monthly goals', 'Trophy', 'special'::badge_category, 'legendary', '{"event_type": "monthly_goals_complete", "threshold": 1}'::jsonb, 1000)
ON CONFLICT (name) DO NOTHING;

-- Insert variable reward configurations with conflict handling
INSERT INTO public.variable_rewards_config (event_type, base_probability, streak_multiplier, performance_multiplier) 
VALUES
  ('contact_added', 0.15, 1.3, 1.8),
  ('activity_completed', 0.10, 1.2, 1.5),
  ('networking_event', 0.25, 1.4, 2.0),
  ('deal_closed', 0.50, 1.5, 2.5),
  ('follow_up_completed', 0.12, 1.25, 1.6)
ON CONFLICT (event_type) DO NOTHING;