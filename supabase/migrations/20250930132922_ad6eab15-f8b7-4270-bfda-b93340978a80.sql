-- Fix relationship category preferences: disable categories that shouldn't be enabled by default
-- This migration corrects the historical issue where all categories were enabled for existing users

DO $$
DECLARE
  affected_users_count INTEGER;
BEGIN
  -- Disable categories that should not be enabled by default
  -- Only disable if user hasn't explicitly enabled them (based on updated_at timestamp)
  UPDATE public.user_relationship_category_preferences
  SET 
    is_enabled = false,
    updated_at = now()
  WHERE category_name IN ('civic_community', 'philanthropy_nonprofit', 'media_press')
    AND is_enabled = true
    -- Only disable if the preference was auto-created (created_at = updated_at)
    -- This preserves explicit user choices
    AND created_at = updated_at;
  
  GET DIAGNOSTICS affected_users_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Disabled % incorrectly enabled categories', affected_users_count;
  RAISE NOTICE '🎉 Category preference cleanup complete!';
END $$;