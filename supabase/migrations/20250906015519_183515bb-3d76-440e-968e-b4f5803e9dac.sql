-- Drop the old function and create the table first
DROP FUNCTION IF EXISTS public.get_admin_user_list();

-- Create guaranteed_rewards_definition table
CREATE TABLE IF NOT EXISTS public.guaranteed_rewards_definition (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
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
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'guaranteed_rewards_definition' AND policyname = 'Admins can manage guaranteed rewards') THEN
    CREATE POLICY "Admins can manage guaranteed rewards" ON public.guaranteed_rewards_definition FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'guaranteed_rewards_definition' AND policyname = 'Authenticated users can view guaranteed rewards') THEN
    CREATE POLICY "Authenticated users can view guaranteed rewards" ON public.guaranteed_rewards_definition FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Create the corrected admin user list function
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