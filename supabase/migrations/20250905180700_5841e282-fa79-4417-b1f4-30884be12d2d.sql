-- Fix educational resources to be available to all authenticated users
-- Resources should not be restricted to paid users or challenge participants

DROP POLICY IF EXISTS "Authenticated users with write access can view published resources" ON public.educational_resources;

CREATE POLICY "All authenticated users can view published resources" 
ON public.educational_resources 
FOR SELECT 
USING (is_published = true AND auth.uid() IS NOT NULL);