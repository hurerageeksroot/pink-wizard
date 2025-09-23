-- Insert guaranteed rewards data
INSERT INTO public.guaranteed_rewards_definition (name, description, metric_key, threshold, reward_name, reward_description, shipping_required, sort_order) 
VALUES
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
ON CONFLICT (name) DO NOTHING;