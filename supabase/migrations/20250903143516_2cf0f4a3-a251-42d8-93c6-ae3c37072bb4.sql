-- Restore gamification views with proper privacy controls
-- These views are meant to show public gamification data while respecting user privacy settings

-- Recreate recent_points_activity view with SECURITY DEFINER for cross-user visibility
-- but only for users who have opted into public leaderboard display
CREATE OR REPLACE VIEW public.recent_points_activity
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
WHERE p.show_in_leaderboard = true
ORDER BY upl.created_at DESC
LIMIT 100;

-- Recreate user_points_summary view with SECURITY DEFINER for cross-user visibility
-- but only for users who have opted into public leaderboard display
CREATE OR REPLACE VIEW public.user_points_summary
WITH (security_invoker = false)
AS
SELECT 
    ups.user_id,
    ups.total_points,
    ups.total_activities,
    ups.last_activity_date,
    ups.current_streak,
    ups.longest_streak,
    ups.this_week_points,
    ups.this_month_points,
    ups.updated_at,
    p.display_name,
    p.avatar_url
FROM user_points_summary_base ups
JOIN profiles p ON p.id = ups.user_id
WHERE p.show_in_leaderboard = true OR ups.user_id = auth.uid();

-- Enable RLS on the views (though they already filter by privacy settings)
ALTER VIEW public.recent_points_activity ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.user_points_summary ENABLE ROW LEVEL SECURITY;

-- Create policies for the views that allow public access to opted-in data
CREATE POLICY "Allow public access to gamification data for opted-in users"
ON public.recent_points_activity
FOR SELECT
USING (
    -- Users can see their own data always
    user_id = auth.uid() 
    OR 
    -- Or data from users who opted into public leaderboard
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = recent_points_activity.user_id 
        AND profiles.show_in_leaderboard = true
    )
);

CREATE POLICY "Allow public access to points summary for opted-in users"
ON public.user_points_summary
FOR SELECT
USING (
    -- Users can see their own data always
    user_id = auth.uid() 
    OR 
    -- Or data from users who opted into public leaderboard
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = user_points_summary.user_id 
        AND profiles.show_in_leaderboard = true
    )
);