-- Drop the existing constraint
ALTER TABLE public.contacts DROP CONSTRAINT contacts_relationship_type_check;

-- Add the updated constraint that includes 'lead_amplifier'
ALTER TABLE public.contacts ADD CONSTRAINT contacts_relationship_type_check 
CHECK (relationship_type = ANY (ARRAY['lead'::text, 'lead_amplifier'::text, 'past_client'::text, 'friend_family'::text, 'associate_partner'::text, 'referral_source'::text, 'booked_client'::text]));