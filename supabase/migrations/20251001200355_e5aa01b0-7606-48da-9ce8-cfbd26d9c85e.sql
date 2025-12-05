-- Fix duplicate trigger causing "touchpoint may already exist" errors
-- Drop the older duplicate trigger that's causing double point awards
DROP TRIGGER IF EXISTS award_activity_points_trigger ON public.activities;

-- The trigger_award_activity_points trigger will remain and handle all point awards