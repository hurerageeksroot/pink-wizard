-- Fix: Enable service_provider and other_misc for all existing users
-- These should be enabled by default per CATEGORY_CONFIGS
UPDATE public.user_relationship_category_preferences
SET is_enabled = true
WHERE category_name IN ('service_provider', 'other_misc')
  AND is_enabled = false;