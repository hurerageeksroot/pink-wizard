-- Drop the database trigger that automatically awards points on contact insert
-- This trigger was causing conflicts with application-level gamification control
DROP TRIGGER IF EXISTS trigger_award_contact_points ON public.contacts;

-- Drop the associated function that's no longer needed
DROP FUNCTION IF EXISTS public.auto_award_contact_points();

-- Check and document remaining contact-related triggers
-- trigger_badge_check_on_contact_update remains for badge checks on updates (separate concern)