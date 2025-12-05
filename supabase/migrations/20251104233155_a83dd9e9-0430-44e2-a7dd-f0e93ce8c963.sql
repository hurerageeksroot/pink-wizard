-- Update the incorrect "Current Client" label to "Client"
UPDATE user_relationship_types
SET 
  label = 'Client',
  updated_at = NOW()
WHERE id = '572ec9b9-93dd-4467-b8cd-2d2463d6e1cf'
  AND name = 'current_client'
  AND label = 'Current Client';