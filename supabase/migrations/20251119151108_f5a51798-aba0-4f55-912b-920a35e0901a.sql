-- Remove Sarah M. Murphy from leaderboard
UPDATE profiles 
SET show_in_leaderboard = false 
WHERE id = 'c0aa2ba3-2f89-4728-b4be-b026da38921d';

-- Update her leaderboard_stats to remove rank position
UPDATE leaderboard_stats 
SET rank_position = null,
    last_updated = now()
WHERE user_id = 'c0aa2ba3-2f89-4728-b4be-b026da38921d';

-- The leaderboard views and RPCs automatically filter based on show_in_leaderboard
-- and recalculate ranks dynamically, so no further changes needed