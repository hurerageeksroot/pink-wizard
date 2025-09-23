-- Update get_user_challenge_points_summary to include all-time points for challenge participants
-- This addresses the requirement that "pre-challenge activity should be counted" for this challenge

CREATE OR REPLACE FUNCTION public.get_user_challenge_points_summary(target_user_id uuid)
RETURNS TABLE(user_id uuid, display_name text, total_points bigint, total_activities bigint, recent_points bigint, recent_activities bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  challenge_start_date date;
  challenge_end_date date;
BEGIN
  -- Get active challenge dates for recent activity calculations
  SELECT start_date, end_date INTO challenge_start_date, challenge_end_date
  FROM public.challenge_config
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no active challenge, return regular points summary
  IF challenge_start_date IS NULL THEN
    RETURN QUERY
    SELECT 
      target_user_id,
      p.display_name,
      COALESCE(SUM(upl.points_earned), 0) AS total_points,
      COUNT(upl.id) AS total_activities,
      0::bigint as recent_points,
      0::bigint as recent_activities
    FROM public.profiles p
    LEFT JOIN public.user_points_ledger upl ON upl.user_id = p.id
    WHERE p.id = target_user_id
    GROUP BY p.id, p.display_name;
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    target_user_id,
    p.display_name,
    -- Total ALL-TIME points (not filtered by challenge dates) per requirement
    COALESCE(SUM(upl.points_earned), 0) AS total_points,
    -- Total ALL-TIME activities count
    COUNT(upl.id) AS total_activities,
    -- Recent points (last 7 days) 
    COALESCE(SUM(upl.points_earned) FILTER (WHERE 
      upl.created_at >= NOW() - INTERVAL '7 days'
    ), 0) AS recent_points,
    -- Recent activities (last 7 days)
    COUNT(upl.id) FILTER (WHERE 
      upl.created_at >= NOW() - INTERVAL '7 days'
    ) AS recent_activities
  FROM public.profiles p
  LEFT JOIN public.user_points_ledger upl ON upl.user_id = p.id
  WHERE p.id = target_user_id
  GROUP BY p.id, p.display_name;
END;
$function$;