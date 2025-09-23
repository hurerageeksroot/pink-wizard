-- Run initial update to backfill all existing challenge progress
SELECT public.update_daily_challenge_progress();