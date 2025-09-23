-- Create function to get challenge-specific points summary for individual users
-- This mirrors the leaderboard logic but returns data for a specific user
CREATE OR REPLACE FUNCTION public.get_user_challenge_points_summary(target_user_id uuid)
 RETURNS TABLE(
   user_id uuid, 
   display_name text, 
   total_points bigint, 
   total_activities bigint,
   recent_points bigint,
   recent_activities bigint
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  challenge_start_date date;
  challenge_end_date date;
BEGIN
  -- Get active challenge dates
  SELECT start_date, end_date INTO challenge_start_date, challenge_end_date
  FROM public.challenge_config
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no active challenge, return zeros
  IF challenge_start_date IS NULL THEN
    RETURN QUERY
    SELECT 
      target_user_id,
      p.display_name,
      0::bigint as total_points,
      0::bigint as total_activities,
      0::bigint as recent_points,
      0::bigint as recent_activities
    FROM public.profiles p
    WHERE p.id = target_user_id;
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    target_user_id,
    p.display_name,
    -- Total challenge points (including pre-challenge onboarding tasks)
    COALESCE(SUM(upl.points_earned) FILTER (WHERE 
      upl.created_at::date BETWEEN challenge_start_date AND challenge_end_date
      OR (upl.activity_type = 'onboarding_task_completed' AND upl.created_at::date < challenge_start_date)
    ), 0) AS total_points,
    -- Total challenge activities count
    COUNT(upl.id) FILTER (WHERE 
      upl.created_at::date BETWEEN challenge_start_date AND challenge_end_date
      OR (upl.activity_type = 'onboarding_task_completed' AND upl.created_at::date < challenge_start_date)
    ) AS total_activities,
    -- Recent points (last 7 days within challenge period)
    COALESCE(SUM(upl.points_earned) FILTER (WHERE 
      upl.created_at >= NOW() - INTERVAL '7 days'
      AND (
        upl.created_at::date BETWEEN challenge_start_date AND challenge_end_date
        OR (upl.activity_type = 'onboarding_task_completed' AND upl.created_at::date < challenge_start_date)
      )
    ), 0) AS recent_points,
    -- Recent activities (last 7 days within challenge period)
    COUNT(upl.id) FILTER (WHERE 
      upl.created_at >= NOW() - INTERVAL '7 days'
      AND (
        upl.created_at::date BETWEEN challenge_start_date AND challenge_end_date
        OR (upl.activity_type = 'onboarding_task_completed' AND upl.created_at::date < challenge_start_date)
      )
    ) AS recent_activities
  FROM public.profiles p
  LEFT JOIN public.user_points_ledger upl ON upl.user_id = p.id
  WHERE p.id = target_user_id
  GROUP BY p.id, p.display_name;
END;
$function$;