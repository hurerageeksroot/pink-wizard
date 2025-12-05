-- Add foreign key from contact_context_assignments to contacts
-- This enforces referential integrity and enables Supabase nested selects
ALTER TABLE public.contact_context_assignments
ADD CONSTRAINT fk_contact_context_assignments_contact_id
FOREIGN KEY (contact_id) 
REFERENCES public.contacts(id) 
ON DELETE CASCADE;

-- Add foreign key from contact_context_assignments to contact_contexts
-- This completes the many-to-many relationship
ALTER TABLE public.contact_context_assignments
ADD CONSTRAINT fk_contact_context_assignments_context_id
FOREIGN KEY (context_id) 
REFERENCES public.contact_contexts(id) 
ON DELETE CASCADE;

-- Add index on contact_id for faster joins
CREATE INDEX IF NOT EXISTS idx_contact_context_assignments_contact_id 
ON public.contact_context_assignments(contact_id);

-- Add index on context_id for faster reverse lookups
CREATE INDEX IF NOT EXISTS idx_contact_context_assignments_context_id 
ON public.contact_context_assignments(context_id);