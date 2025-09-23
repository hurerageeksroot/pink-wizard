-- Fix security definer views by recreating them without SECURITY DEFINER

-- Drop and recreate recent_points_activity view without SECURITY DEFINER
DROP VIEW IF EXISTS public.recent_points_activity;

CREATE VIEW public.recent_points_activity AS
SELECT 
  ub.id,
  ub.user_id,
  p.display_name,
  bd.name as activity_type,
  bd.description,
  bd.points_reward as points_earned,
  ub.earned_at as created_at,
  1 as challenge_day, -- Default value since we don't have this in user_badges
  ub.progress_data as metadata
FROM public.user_badges ub
JOIN public.badges_definition bd ON ub.badge_id = bd.id
JOIN public.profiles p ON ub.user_id = p.id
WHERE ub.earned_at >= now() - INTERVAL '7 days'
ORDER BY ub.earned_at DESC
LIMIT 50;

-- Drop and recreate user_points_summary view without SECURITY DEFINER  
DROP VIEW IF EXISTS public.user_points_summary;

CREATE VIEW public.user_points_summary AS
SELECT 
  p.id as user_id,
  p.display_name,
  COALESCE(SUM(um.value), 0) as total_points,
  COALESCE(MAX(ucp.current_streak), 0) as current_streak,
  COALESCE(MAX(ucp.total_days_completed), 0) as days_completed,
  COUNT(ub.id) as badges_earned
FROM public.profiles p
LEFT JOIN public.user_metrics um ON p.id = um.user_id AND um.metric_name = 'outreach_points'
LEFT JOIN public.user_challenge_progress ucp ON p.id = ucp.user_id
LEFT JOIN public.user_badges ub ON p.id = ub.user_id
GROUP BY p.id, p.display_name;