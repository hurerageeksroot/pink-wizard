-- Update activities table to support all activity types shown in the UI
-- First, let's see what constraint exists and drop it
DO $$
BEGIN
    -- Drop the existing check constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activities_type_check') THEN
        ALTER TABLE public.activities DROP CONSTRAINT activities_type_check;
    END IF;
END $$;

-- Add the proper check constraint to support all activity types
ALTER TABLE public.activities 
ADD CONSTRAINT activities_type_check 
CHECK (type IN ('email', 'call', 'linkedin', 'social_media', 'meeting', 'revenue'));

-- Update any existing 'call' activities that should be 'revenue' based on their title
UPDATE public.activities 
SET type = 'revenue' 
WHERE type = 'call' 
AND (title ILIKE '%revenue%' OR title ILIKE '%referral revenue%');