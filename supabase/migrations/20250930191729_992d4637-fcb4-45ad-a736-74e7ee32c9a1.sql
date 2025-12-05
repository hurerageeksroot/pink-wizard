-- Drop the problematic update_leaderboard_stats function that references total_activities
DROP FUNCTION IF EXISTS public.update_leaderboard_stats(user_id_param uuid);

-- Note: The parameterless version of update_leaderboard_stats() remains intact
-- and will continue to work with triggers and other automation