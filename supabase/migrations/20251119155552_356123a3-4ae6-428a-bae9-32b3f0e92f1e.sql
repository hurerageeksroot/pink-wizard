-- Remove hello@mobilebevpros.com (Sarah M. Murphy) from leaderboard
UPDATE profiles 
SET show_in_leaderboard = false 
WHERE id = '8911c9ef-4c9f-43da-9162-b11087f25bfd';

-- Update leaderboard_stats to remove rank position
UPDATE leaderboard_stats 
SET rank_position = null,
    last_updated = now()
WHERE user_id = '8911c9ef-4c9f-43da-9162-b11087f25bfd';

-- The leaderboard views and RPCs will automatically recalculate ranks