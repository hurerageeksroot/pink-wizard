-- Clean up legacy relationship intent configurations
-- These old intents are replaced by category-aligned configs with _statuses suffix

DELETE FROM public.relationship_intent_configs
WHERE intent IN (
  'industry_contact',
  'media_press',
  'other_misc',
  'past_client',
  'philanthropy_nonprofit',
  'referral_source',
  'service_provider'
);

-- After this cleanup, only these 5 category-aligned intents remain:
-- 1. business_lead_statuses (Business Lead)
-- 2. business_nurture_statuses (Business Nurture)
-- 3. civic_statuses (Civic & Community)
-- 4. personal_statuses (Personal Connection)
-- 5. vendor_statuses (Service Provider/Vendor)