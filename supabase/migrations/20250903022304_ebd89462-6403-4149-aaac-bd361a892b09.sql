-- Fix security issues by recreating views without SECURITY DEFINER
-- Drop existing views
DROP VIEW IF EXISTS public.user_points_summary;
DROP VIEW IF EXISTS public.recent_points_activity;

-- Recreate views without SECURITY DEFINER (they shouldn't need it)
CREATE VIEW public.user_points_summary AS
SELECT 
  user_id,
  SUM(points_earned) as total_points,
  COUNT(*) as total_activities,
  MAX(created_at) as last_activity
FROM public.user_points_ledger
GROUP BY user_id;

CREATE VIEW public.recent_points_activity AS
SELECT 
  upl.*,
  p.display_name
FROM public.user_points_ledger upl
LEFT JOIN public.profiles p ON p.id = upl.user_id
ORDER BY upl.created_at DESC;

-- Grant necessary permissions
GRANT SELECT ON public.user_points_summary TO authenticated;
GRANT SELECT ON public.recent_points_activity TO authenticated;