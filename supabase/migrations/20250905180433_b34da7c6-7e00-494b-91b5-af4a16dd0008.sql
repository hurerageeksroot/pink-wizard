-- Fix educational resources access for challenge participants
-- The current policy only checks payments, but should also allow challenge participants

DROP POLICY IF EXISTS "Authenticated users with valid access can view published educat" ON public.educational_resources;

CREATE POLICY "Authenticated users with write access can view published resources" 
ON public.educational_resources 
FOR SELECT 
USING (is_published = true AND user_can_write());