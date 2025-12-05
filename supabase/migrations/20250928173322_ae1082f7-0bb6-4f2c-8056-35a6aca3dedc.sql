-- Add missing relationship intent configurations for civic engagement and philanthropy nonprofit

-- Insert civic_engagement intent config
INSERT INTO public.relationship_intent_configs (
  intent,
  label,
  description,
  icon_name,
  color_class,
  default_status
) VALUES (
  'civic_engagement',
  'Civic & Community',
  'Government, community leaders, and civic organizations',
  'Building',
  'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  'unaware'
) ON CONFLICT (intent) DO NOTHING;

-- Insert philanthropy_nonprofit intent config
INSERT INTO public.relationship_intent_configs (
  intent,
  label,
  description,
  icon_name,
  color_class,
  default_status
) VALUES (
  'philanthropy_nonprofit',
  'Philanthropy & Nonprofits',
  'Donors, volunteers, and nonprofit organizations',
  'Gift',
  'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
  'prospect'
) ON CONFLICT (intent) DO NOTHING;

-- Add status options for civic_engagement
INSERT INTO public.relationship_status_options (
  intent,
  status_key,
  label,
  description,
  color_class,
  sort_order,
  is_terminal
) VALUES 
  ('civic_engagement', 'unaware', 'Unaware', 'Not yet engaged', 'bg-gray-100 text-gray-800', 1, false),
  ('civic_engagement', 'aware', 'Aware', 'Knows about issue/cause', 'bg-blue-100 text-blue-800', 2, false),
  ('civic_engagement', 'engaged', 'Engaged', 'Actively participating', 'bg-yellow-100 text-yellow-800', 3, false),
  ('civic_engagement', 'advocate', 'Advocate', 'Promoting the cause', 'bg-orange-100 text-orange-800', 4, false),
  ('civic_engagement', 'champion', 'Champion', 'Leading the effort', 'bg-green-100 text-green-800', 5, false)
ON CONFLICT (intent, status_key) DO NOTHING;

-- Add status options for philanthropy_nonprofit
INSERT INTO public.relationship_status_options (
  intent,
  status_key,
  label,
  description,
  color_class,
  sort_order,
  is_terminal
) VALUES 
  ('philanthropy_nonprofit', 'prospect', 'Prospect', 'Potential supporter', 'bg-blue-100 text-blue-800', 1, false),
  ('philanthropy_nonprofit', 'donor', 'Donor', 'Financial contributor', 'bg-green-100 text-green-800', 2, false),
  ('philanthropy_nonprofit', 'volunteer', 'Volunteer', 'Active volunteer', 'bg-yellow-100 text-yellow-800', 3, false),
  ('philanthropy_nonprofit', 'board_member', 'Board Member', 'Leadership role', 'bg-purple-100 text-purple-800', 4, false),
  ('philanthropy_nonprofit', 'major_donor', 'Major Donor', 'Significant contributor', 'bg-orange-100 text-orange-800', 5, false),
  ('philanthropy_nonprofit', 'inactive', 'Inactive', 'No longer involved', 'bg-gray-100 text-gray-800', 6, true)
ON CONFLICT (intent, status_key) DO NOTHING;