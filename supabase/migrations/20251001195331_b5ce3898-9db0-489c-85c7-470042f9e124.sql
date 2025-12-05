-- Update existing contacts with "Current Client" status to "client"
UPDATE public.contacts
SET relationship_status = 'client'
WHERE relationship_status = 'Current Client';