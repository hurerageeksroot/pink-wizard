-- Check current constraint and fix it to include 'text'
-- First, let's see the current constraint
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'activities_type_check';

-- Drop the existing constraint and recreate it with 'text' included
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;

-- Create new constraint that includes 'text' along with other valid types
ALTER TABLE activities ADD CONSTRAINT activities_type_check 
CHECK (type IN ('email', 'linkedin', 'social', 'call', 'meeting', 'mail', 'text', 'revenue', 'status_change'));