-- Fix the get_admin_user_list function with correct return types
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