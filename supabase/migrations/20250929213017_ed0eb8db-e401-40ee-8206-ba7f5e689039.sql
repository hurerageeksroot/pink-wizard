-- Migrate existing contacts to use new relationship_intent enum values
-- This ensures existing data works with the updated relationship system

-- Update business lead contacts
UPDATE public.contacts
SET relationship_intent = 'business_lead_statuses'
WHERE relationship_intent = 'business_lead';

-- Update business nurture contacts
UPDATE public.contacts
SET relationship_intent = 'business_nurture_statuses'
WHERE relationship_intent = 'business_nurture';

-- Update personal connection contacts
UPDATE public.contacts
SET relationship_intent = 'personal_statuses'
WHERE relationship_intent = 'personal_connection';

-- Update civic engagement contacts
UPDATE public.contacts
SET relationship_intent = 'civic_statuses'
WHERE relationship_intent IN ('civic_engagement', 'community_member');

-- Update vendor/service provider contacts
UPDATE public.contacts
SET relationship_intent = 'vendor_statuses'
WHERE relationship_intent = 'service_provider';

-- Update any philanthropy/nonprofit contacts to business nurture
UPDATE public.contacts
SET relationship_intent = 'business_nurture_statuses'
WHERE relationship_intent = 'philanthropy_nonprofit';