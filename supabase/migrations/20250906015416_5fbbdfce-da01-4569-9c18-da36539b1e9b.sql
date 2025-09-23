-- Drop and recreate the function with correct return types
DROP FUNCTION IF EXISTS public.get_admin_user_list();

CREATE OR REPLACE FUNCTION public.get_admin_user_list()
RETURNS TABLE(
  id uuid,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone,
  company_name text,
  location text,
  show_in_leaderboard boolean,
  last_sign_in_at timestamp with time zone,
  email_confirmed_at timestamp with time zone,
  roles text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow admin users to access this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    au.email::text,  -- Cast to text to match return type
    p.display_name,
    p.avatar_url,
    p.created_at,
    p.company_name,
    p.location,
    p.show_in_leaderboard,
    au.last_sign_in_at,
    au.email_confirmed_at,
    COALESCE(
      array_agg(ur.role::text) FILTER (WHERE ur.role IS NOT NULL), 
      ARRAY[]::text[]
    ) as roles
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  GROUP BY p.id, au.email, p.display_name, p.avatar_url, p.created_at, 
           p.company_name, p.location, p.show_in_leaderboard, 
           au.last_sign_in_at, au.email_confirmed_at
  ORDER BY p.created_at DESC;
END;
$$;

-- Also check if we have gamification data
INSERT INTO public.guaranteed_rewards_definition (name, description, metric_key, threshold, reward_name, reward_description, shipping_required, sort_order) 
VALUES
  ('First Steps', 'Welcome reward for joining the platform', 'contacts_added', 1, 'Welcome Kit', 'Branded notebook and pen set', true, 1),
  ('Networking Rookie', 'Building your initial network', 'contacts_added', 10, 'Business Card Holder', 'Premium leather business card holder', true, 2),
  ('Network Builder', 'Expanding your professional network', 'contacts_added', 25, 'Networking Guide', 'Digital networking strategy guide + coffee tumbler', false, 3),
  ('Connection Master', 'Serious networking commitment', 'contacts_added', 50, 'Professional Portfolio', 'Leather portfolio with company logo', true, 4),
  ('Networking Elite', 'Top tier networking achievement', 'contacts_added', 100, 'Executive Gift Set', 'Premium pen set and desk accessories', true, 5)
ON CONFLICT (name) DO NOTHING;