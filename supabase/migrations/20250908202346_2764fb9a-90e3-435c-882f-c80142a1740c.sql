-- Clean up unused functions to prevent any remaining conflicts

-- Remove the old check_user_milestone_bonuses function if it exists (might be causing issues)
DROP FUNCTION IF EXISTS public.check_user_milestone_bonuses(uuid);

-- Remove any other potentially conflicting functions
DROP FUNCTION IF EXISTS public.check_milestone_bonuses(uuid);

-- Remove the old/unused award_contact_points function since we removed its trigger
DROP FUNCTION IF EXISTS public.award_contact_points();

-- Make sure we have the correct check_and_award_badges function signature
-- This should match what the client code expects