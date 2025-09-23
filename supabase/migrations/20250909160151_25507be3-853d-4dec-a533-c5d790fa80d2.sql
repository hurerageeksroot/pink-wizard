-- Fix get_active_challenge_participant_count to count distinct active users only
CREATE OR REPLACE FUNCTION public.get_active_challenge_participant_count()
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  participant_count INTEGER;
BEGIN
  -- Get count of DISTINCT users with active challenge progress
  SELECT COUNT(DISTINCT user_id)
  INTO participant_count
  FROM public.user_challenge_progress ucp
  WHERE ucp.is_active = true;
  
  RETURN COALESCE(participant_count, 0);
END;
$function$;

-- Fix get_admin_users_with_challenge to select best progress row per user
CREATE OR REPLACE FUNCTION public.get_admin_users_with_challenge()
 RETURNS TABLE(id uuid, email character varying, display_name text, avatar_url text, company_name text, location text, show_in_leaderboard boolean, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, email_confirmed_at timestamp with time zone, roles text[], challenge_active boolean, challenge_joined_at timestamp with time zone, challenge_days_completed integer, challenge_progress numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admin users to access this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  WITH best_challenge_progress AS (
    -- Select the most recent active progress row per user, or most recent inactive if no active
    SELECT DISTINCT ON (user_id)
      user_id,
      is_active,
      joined_at,
      total_days_completed,
      overall_progress
    FROM public.user_challenge_progress
    ORDER BY user_id, is_active DESC, updated_at DESC
  )
  SELECT 
    p.id,
    au.email::varchar(255),
    p.display_name,
    p.avatar_url,
    p.company_name,
    p.location,
    p.show_in_leaderboard,
    p.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    COALESCE(
      array_agg(ur.role::text) FILTER (WHERE ur.role IS NOT NULL), 
      ARRAY[]::text[]
    ) as roles,
    COALESCE(bcp.is_active, false) as challenge_active,
    bcp.joined_at as challenge_joined_at,
    COALESCE(bcp.total_days_completed, 0) as challenge_days_completed,
    COALESCE(bcp.overall_progress, 0) as challenge_progress
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  LEFT JOIN best_challenge_progress bcp ON p.id = bcp.user_id
  GROUP BY p.id, au.email, p.display_name, p.avatar_url, p.company_name, 
           p.location, p.show_in_leaderboard, p.created_at, 
           au.last_sign_in_at, au.email_confirmed_at,
           bcp.is_active, bcp.joined_at, bcp.total_days_completed, bcp.overall_progress
  ORDER BY p.created_at DESC;
END;
$function$;