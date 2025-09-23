-- Drop existing views to recreate them with proper privacy controls
DROP VIEW IF EXISTS public.recent_points_activity CASCADE;
DROP VIEW IF EXISTS public.user_points_summary CASCADE;

-- Create recent_points_activity view with SECURITY DEFINER for public gamification data
-- Shows recent activity from users who opted into leaderboard visibility
CREATE VIEW public.recent_points_activity
WITH (security_invoker = false)
AS
SELECT 
    upl.id,
    upl.user_id,
    upl.activity_type,
    upl.points_earned,
    upl.description,
    upl.metadata,
    upl.created_at,
    upl.challenge_day,
    COALESCE(p.display_name, 'Anonymous') as display_name
FROM user_points_ledger upl
LEFT JOIN profiles p ON p.id = upl.user_id
WHERE (p.show_in_leaderboard = true OR upl.user_id = auth.uid())
ORDER BY upl.created_at DESC;

-- Create user_points_summary view with SECURITY DEFINER for public leaderboard data
-- Aggregates points data for users who opted into leaderboard visibility
CREATE VIEW public.user_points_summary
WITH (security_invoker = false)
AS
SELECT 
    upl.user_id,
    COALESCE(p.display_name, 'Anonymous') as display_name,
    COALESCE(SUM(upl.points_earned), 0) as total_points,
    COUNT(*) as total_activities,
    MAX(upl.created_at) as last_activity_date,
    0 as current_streak, -- TODO: Calculate actual streak
    0 as longest_streak, -- TODO: Calculate actual streak
    COALESCE(COUNT(CASE WHEN upl.created_at >= date_trunc('week', now()) THEN 1 END), 0) as this_week_activities,
    COALESCE(COUNT(CASE WHEN upl.created_at >= date_trunc('month', now()) THEN 1 END), 0) as this_month_activities,
    now() as updated_at
FROM user_points_ledger upl
LEFT JOIN profiles p ON p.id = upl.user_id
WHERE (p.show_in_leaderboard = true OR upl.user_id = auth.uid())
GROUP BY upl.user_id, p.display_name;

-- Grant access to authenticated users for public gamification data
GRANT SELECT ON public.recent_points_activity TO authenticated;
GRANT SELECT ON public.user_points_summary TO authenticated;