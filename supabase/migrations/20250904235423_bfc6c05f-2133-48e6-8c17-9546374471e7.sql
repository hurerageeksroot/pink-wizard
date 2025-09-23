-- First, convert existing 'revenue' activities to 'meeting' type (since they're likely revenue meetings)
UPDATE activities 
SET type = 'meeting' 
WHERE type = 'revenue';

-- Now drop the old constraint
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;

-- Add updated constraint that matches our TouchpointType definition
ALTER TABLE activities ADD CONSTRAINT activities_type_check 
CHECK (type IN ('email', 'linkedin', 'social', 'call', 'meeting', 'mail'));