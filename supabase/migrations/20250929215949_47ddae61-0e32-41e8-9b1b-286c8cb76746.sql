-- Map all contacts from relationship_type to new intent-based structure
UPDATE public.contacts
SET 
  relationship_intent = CASE 
    WHEN relationship_type IN ('cold_lead', 'warm_lead', 'lead') THEN 'business_lead_statuses'
    WHEN relationship_type IN ('current_client', 'past_client', 'referral', 'partner') THEN 'business_nurture_statuses'
    WHEN relationship_type = 'friend' THEN 'personal_statuses'
    ELSE 'business_lead_statuses'
  END,
  relationship_status = CASE 
    WHEN relationship_type = 'cold_lead' THEN 'cold'
    WHEN relationship_type = 'warm_lead' THEN 'warm'
    WHEN relationship_type = 'lead' THEN 'cold'
    WHEN relationship_type = 'current_client' THEN 'current_client'
    WHEN relationship_type = 'past_client' THEN 'past_client'
    WHEN relationship_type = 'referral' THEN 'current_amplifier'
    WHEN relationship_type = 'partner' THEN 'strategic_partner'
    WHEN relationship_type = 'friend' THEN 'close_circle'
    ELSE 'cold'
  END
WHERE relationship_intent = 'other_misc';