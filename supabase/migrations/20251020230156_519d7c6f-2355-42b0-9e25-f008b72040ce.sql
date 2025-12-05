-- Ensure past_client relationship type exists for all users who need it
-- This fixes the issue where past_client was deleted but contacts still referenced it

CREATE OR REPLACE FUNCTION ensure_past_client_type()
RETURNS void AS $$
DECLARE
  affected_users uuid[];
BEGIN
  -- Find users with lead_amplifier contacts but no past_client type
  SELECT ARRAY_AGG(DISTINCT user_id) INTO affected_users
  FROM contacts
  WHERE relationship_type = 'lead_amplifier'
  AND user_id NOT IN (
    SELECT user_id FROM user_relationship_types WHERE name = 'past_client'
  );
  
  -- Only proceed if there are affected users
  IF affected_users IS NOT NULL AND array_length(affected_users, 1) > 0 THEN
    -- Insert past_client type for affected users
    INSERT INTO user_relationship_types (
      user_id, name, label, relationship_intent, 
      icon_name, color_class, is_default, sort_order
    )
    SELECT 
      unnest(affected_users),
      'past_client',
      'Past Client',
      'business_nurture_statuses',
      'UserCheck',
      'bg-blue-100 text-blue-800 border-blue-200',
      false,
      1000
    ON CONFLICT (user_id, name) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to seed missing types
SELECT ensure_past_client_type();