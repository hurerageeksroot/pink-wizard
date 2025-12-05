-- Update the label for the current_client relationship type to just "Client"
-- This separates the relationship type "Client" from the relationship status "Current Client"
UPDATE user_relationship_types
SET label = 'Client',
    updated_at = now()
WHERE name = 'current_client';