-- Add "Current Client" relationship type for existing users
INSERT INTO public.user_relationship_types (
  user_id,
  name,
  label,
  icon_name,
  color_class,
  relationship_intent,
  is_default,
  sort_order
)
SELECT 
  urt.user_id,
  'current_client',
  'Current Client',
  'Handshake',
  'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  'business_nurture',
  true,
  4
FROM public.user_relationship_types urt
WHERE urt.name = 'past_client'  -- Use past_client as indicator that user has default types
  AND NOT EXISTS (
    SELECT 1 FROM public.user_relationship_types urt2 
    WHERE urt2.user_id = urt.user_id 
    AND urt2.name = 'current_client'
  )
GROUP BY urt.user_id;

-- Update sort orders for existing types to make room for current_client at position 4
UPDATE public.user_relationship_types 
SET sort_order = CASE 
  WHEN name = 'past_client' THEN 5
  WHEN name = 'referral_source' THEN 6
  WHEN name = 'friend_family' THEN 7
  WHEN name = 'service_provider' THEN 8
  WHEN name = 'community_member' THEN 9
  ELSE sort_order
END
WHERE name IN ('past_client', 'referral_source', 'friend_family', 'service_provider', 'community_member');