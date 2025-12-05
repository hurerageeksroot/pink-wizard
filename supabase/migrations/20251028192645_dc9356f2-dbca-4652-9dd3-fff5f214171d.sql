-- Remove donor-related types from business_nurture_statuses
-- These belong in the philanthropy_nonprofit category instead

-- Step 1: Migrate contacts using donor/volunteer/past_donor in business_nurture to 'nurture'
-- Only for users who don't have philanthropy_nonprofit enabled
UPDATE contacts
SET relationship_type = 'nurture'
WHERE relationship_type IN ('donor', 'volunteer', 'past_donor')
  AND user_id IN (
    SELECT user_id FROM user_relationship_types
    WHERE name IN ('donor', 'volunteer', 'past_donor')
      AND relationship_intent = 'business_nurture_statuses'
  )
  AND user_id NOT IN (
    SELECT user_id FROM user_relationship_category_preferences
    WHERE category_name = 'philanthropy_nonprofit'
      AND is_enabled = true
  );

-- Step 2: Remove these types from business_nurture_statuses
DELETE FROM user_relationship_types
WHERE name IN ('donor', 'volunteer', 'past_donor', 'staff')
  AND relationship_intent = 'business_nurture_statuses';