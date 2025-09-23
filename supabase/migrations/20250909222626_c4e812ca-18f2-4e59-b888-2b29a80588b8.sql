-- Fix revenue leaderboard to include revenue from all contact statuses
-- This allows revenue to be tracked regardless of contact status
DROP FUNCTION IF EXISTS public.get_revenue_leaderboard();

CREATE OR REPLACE FUNCTION public.get_revenue_leaderboard()
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, total_revenue numeric, won_deals bigint, total_contacts bigint, rank_position bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH active_challenge AS (
    SELECT start_date, end_date
    FROM public.challenge_config
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1
  ),
  participants AS (
    SELECT ucp.user_id
    FROM public.user_challenge_progress ucp
    WHERE ucp.is_active = true
  )
  SELECT
    p.id AS user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(c.revenue_amount), 0) AS total_revenue,
    COUNT(c.id) FILTER (WHERE c.status = 'won') AS won_deals,
    COUNT(c.id) AS total_contacts,
    DENSE_RANK() OVER (ORDER BY COALESCE(SUM(c.revenue_amount), 0) DESC) AS rank_position
  FROM public.profiles p
  JOIN participants part ON part.user_id = p.id
  LEFT JOIN public.contacts c
    ON c.user_id = p.id
    AND c.is_demo = false
    AND c.revenue_amount > 0
    AND EXISTS (SELECT 1 FROM active_challenge)
    AND c.updated_at::date BETWEEN (SELECT start_date FROM active_challenge) AND (SELECT end_date FROM active_challenge)
  WHERE p.show_in_leaderboard = true
  GROUP BY p.id, p.display_name, p.avatar_url
  ORDER BY total_revenue DESC;
$function$;