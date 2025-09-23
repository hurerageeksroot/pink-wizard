-- Drop existing views first to avoid column conflicts
DROP VIEW IF EXISTS public.recent_points_activity;
DROP VIEW IF EXISTS public.user_points_summary;

-- Now recreate the gamification views with proper privacy controls
-- These views show public gamification data while respecting user privacy settings

-- Create recent_points_activity view - shows recent activity from users who opted into leaderboard
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
    p.display_name
FROM user_points_ledger upl
JOIN profiles p ON p.id = upl.user_id
WHERE p.show_in_leaderboard = true OR upl.user_id = auth.uid()
ORDER BY upl.created_at DESC;

-- Create user_points_summary view - shows points summary for users who opted into leaderboard
CREATE VIEW public.user_points_summary  
WITH (security_invoker = false)
AS
SELECT 
    user_id,
    total_points,
    total_activities,
    last_activity_date,
    current_streak,
    longest_streak,
    this_week_points,
    this_month_points,
    updated_at
FROM user_points_summary_raw
WHERE user_id IN (
    SELECT id FROM profiles 
    WHERE show_in_leaderboard = true OR id = auth.uid()
);

-- Grant access to authenticated users
GRANT SELECT ON public.recent_points_activity TO authenticated;
GRANT SELECT ON public.user_points_summary TO authenticated;