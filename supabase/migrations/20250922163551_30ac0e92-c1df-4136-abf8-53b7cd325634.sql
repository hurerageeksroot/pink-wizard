-- Fix security warning: Set proper search_path for functions
CREATE OR REPLACE FUNCTION public.get_points_leaderboard()
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, total_points bigint, total_activities bigint, rank_position bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  WITH participants AS (
    SELECT ucp.user_id
    FROM public.user_challenge_progress ucp
    WHERE ucp.is_active = true
  )
  SELECT 
    p.id AS user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(upl.points_earned), 0) AS total_points,
    COUNT(upl.id) AS total_activities,
    DENSE_RANK() OVER (ORDER BY COALESCE(SUM(upl.points_earned), 0) DESC) AS rank_position
  FROM public.profiles p
  JOIN participants part ON part.user_id = p.id
  LEFT JOIN public.user_points_ledger upl ON upl.user_id = p.id
  WHERE p.show_in_leaderboard = true
  GROUP BY p.id, p.display_name, p.avatar_url
  ORDER BY total_points DESC;
$function$;

CREATE OR REPLACE FUNCTION public.get_revenue_leaderboard()
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, total_revenue numeric, contacts_count bigint, rank_position bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  WITH participants AS (
    SELECT ucp.user_id
    FROM public.user_challenge_progress ucp
    WHERE ucp.is_active = true
  )
  SELECT 
    p.id AS user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(c.revenue_amount), 0) AS total_revenue,
    COUNT(c.id) AS contacts_count,
    DENSE_RANK() OVER (ORDER BY COALESCE(SUM(c.revenue_amount), 0) DESC) AS rank_position
  FROM public.profiles p
  JOIN participants part ON part.user_id = p.id
  LEFT JOIN public.contacts c ON c.user_id = p.id AND c.revenue_amount > 0
  WHERE p.show_in_leaderboard = true
  GROUP BY p.id, p.display_name, p.avatar_url
  ORDER BY total_revenue DESC;
$function$;