-- Add 'introduction' to the activities type check constraint
-- This enables logging activities where you introduce two contacts to each other

-- Drop the existing constraint
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_type_check;

-- Recreate with 'introduction' included
ALTER TABLE public.activities ADD CONSTRAINT activities_type_check 
CHECK (type IN (
  'email', 
  'linkedin', 
  'social', 
  'call', 
  'meeting', 
  'mail', 
  'text', 
  'introduction',
  'revenue', 
  'status_change'
));

-- Add comment to document the constraint
COMMENT ON CONSTRAINT activities_type_check ON public.activities IS 
'Ensures activity type is one of the valid touchpoint types (email, linkedin, social, call, meeting, mail, text, introduction) or system types (revenue, status_change)';