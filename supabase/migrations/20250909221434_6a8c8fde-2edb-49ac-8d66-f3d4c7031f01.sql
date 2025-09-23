-- Fix the activities type constraint to include 'text'
-- Drop existing constraint and recreate with 'text' included
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_type_check;

-- Create new constraint that includes all valid touchpoint types including 'text'
ALTER TABLE public.activities ADD CONSTRAINT activities_type_check 
CHECK (type IN ('email', 'linkedin', 'social', 'call', 'meeting', 'mail', 'text', 'revenue', 'status_change'));