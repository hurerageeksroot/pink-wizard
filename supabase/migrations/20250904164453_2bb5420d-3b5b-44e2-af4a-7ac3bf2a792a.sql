-- Add contact_id column to user_metrics table to properly track revenue per contact
ALTER TABLE public.user_metrics 
ADD COLUMN contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;