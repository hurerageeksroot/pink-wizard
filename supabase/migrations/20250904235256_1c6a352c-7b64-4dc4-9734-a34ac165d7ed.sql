-- Check current constraint
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'activities_type_check';

-- Drop the old constraint
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;

-- Add updated constraint that matches our TouchpointType definition
ALTER TABLE activities ADD CONSTRAINT activities_type_check 
CHECK (type IN ('email', 'linkedin', 'social', 'call', 'meeting', 'mail'));