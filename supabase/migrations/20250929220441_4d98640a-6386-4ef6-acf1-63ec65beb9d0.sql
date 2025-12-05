-- Remove old duplicate intent configs that have been replaced with _statuses versions
DELETE FROM public.relationship_intent_configs
WHERE intent IN (
  'business_lead',
  'business_nurture', 
  'civic_engagement',
  'personal_connection',
  'vendor_relationship'
);