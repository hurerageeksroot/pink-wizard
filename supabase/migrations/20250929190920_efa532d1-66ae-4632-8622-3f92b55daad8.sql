-- Data cleanup migration: Add relationship_intent column and fix orphaned relationship types

-- Step 1: Add relationship_intent column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contacts' 
    AND column_name = 'relationship_intent'
  ) THEN
    ALTER TABLE public.contacts 
    ADD COLUMN relationship_intent text DEFAULT 'other_misc';
  END IF;
END $$;

-- Step 2: Update contacts with old relationship type names to new ones
UPDATE public.contacts
SET relationship_type = CASE 
  WHEN relationship_type = 'lead_amplifier' THEN 'warm_lead'
  WHEN relationship_type = 'lead' THEN 'cold_lead'
  WHEN relationship_type = 'past_client' THEN 'referral'
  WHEN relationship_type = 'booked_client' THEN 'client'
  WHEN relationship_type = 'referral_source' THEN 'referral'
  WHEN relationship_type = 'associate_partner' THEN 'partner'
  WHEN relationship_type = 'friend_family' THEN 'personal_contact'
  ELSE relationship_type
END
WHERE relationship_type IN (
  'lead_amplifier', 'lead', 'past_client', 'booked_client', 
  'referral_source', 'associate_partner', 'friend_family'
);

-- Step 3: Set relationship_intent based on relationship_type
UPDATE public.contacts
SET relationship_intent = CASE 
  WHEN relationship_type IN ('cold_lead', 'warm_lead', 'hot_lead') THEN 'business_lead'
  WHEN relationship_type IN ('client', 'referral') THEN 'business_nurture'
  WHEN relationship_type = 'partner' THEN 'service_provider'
  WHEN relationship_type = 'personal_contact' THEN 'personal_connection'
  ELSE 'other_misc'
END
WHERE relationship_intent IS NULL OR relationship_intent = '';

-- Step 4: Default any remaining invalid relationship types
UPDATE public.contacts c
SET relationship_type = 'general_contact',
    relationship_intent = 'other_misc'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_relationship_types urt
  WHERE urt.user_id = c.user_id 
    AND urt.name = c.relationship_type
)
AND c.relationship_type NOT IN (
  'cold_lead', 'warm_lead', 'hot_lead', 'client', 'referral', 
  'partner', 'personal_contact', 'general_contact'
);

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_relationship_type 
ON public.contacts(user_id, relationship_type);

CREATE INDEX IF NOT EXISTS idx_contacts_relationship_intent
ON public.contacts(user_id, relationship_intent);