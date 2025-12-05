-- Migration: Move past_client contacts to Client type with Past Client status
-- Step 1: Update all contacts with past_client type
UPDATE contacts
SET 
  relationship_type = 'current_client',
  relationship_intent = 'business_nurture_statuses',
  relationship_status = 'Past Client',
  updated_at = NOW()
WHERE relationship_type = 'past_client';

-- Step 2: Clean up invalid type entries from user_relationship_types
DELETE FROM user_relationship_types 
WHERE name = 'past_client' 
  AND relationship_intent = 'business_nurture_statuses';

-- Verification: Check that no contacts remain with past_client type
-- (This is just a comment for documentation - the migration above should handle all cases)