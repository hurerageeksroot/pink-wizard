-- First, update the check constraint to allow 'revenue' and 'status_change' types
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;

-- Add the updated constraint that includes the new activity types
ALTER TABLE activities ADD CONSTRAINT activities_type_check 
CHECK (type IN ('email', 'linkedin', 'social', 'call', 'meeting', 'mail', 'revenue', 'status_change'));

-- Now create activity records for existing revenue entries
INSERT INTO activities (
  user_id,
  contact_id, 
  type,
  title,
  description,
  response_received,
  completed_at,
  created_at
)
SELECT DISTINCT
  um.user_id,
  um.contact_id,
  'revenue' as type,
  'Revenue Logged: $' || um.value::text as title,
  COALESCE('Revenue entry: ' || um.notes, 'Revenue logged for contact') as description,
  false as response_received,
  um.created_at as completed_at,
  um.created_at
FROM user_metrics um
WHERE um.metric_name = 'event_value' 
  AND um.metric_type = 'currency'
  AND um.contact_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM activities a 
    WHERE a.contact_id = um.contact_id 
      AND a.user_id = um.user_id
      AND a.type = 'revenue'
      AND DATE(a.created_at) = DATE(um.created_at)
  );