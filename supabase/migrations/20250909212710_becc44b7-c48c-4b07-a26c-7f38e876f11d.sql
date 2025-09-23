-- Remove unused functions that are no longer needed
DROP FUNCTION IF EXISTS public.upsert_user_daily_task(uuid, uuid, integer, boolean);
DROP FUNCTION IF EXISTS public.trigger_challenge_progress_update();