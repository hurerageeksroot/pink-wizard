-- Drop the old 4-parameter version of award_points function
-- This removes the function signature conflict, leaving only the new 5-parameter version
DROP FUNCTION IF EXISTS public.award_points(uuid, text, text, jsonb);

-- Verify the remaining function exists (5-parameter version with skip_milestone_checks)
-- No action needed - the new version is already in place from the previous migration