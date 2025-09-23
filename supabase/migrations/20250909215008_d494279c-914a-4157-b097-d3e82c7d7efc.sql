-- Fix challenge progress for users who completed tasks but didn't get progress updated
-- This will recalculate challenge progress for all active participants

-- Call the existing RPC to update daily challenge progress
SELECT public.update_daily_challenge_progress();