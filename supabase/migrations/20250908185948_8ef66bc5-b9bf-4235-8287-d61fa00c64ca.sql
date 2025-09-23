-- Fix email_sequences public access vulnerability
-- Remove public read access and restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active email sequences" ON public.email_sequences;

CREATE POLICY "Authenticated users can view active email sequences"
ON public.email_sequences
FOR SELECT
TO authenticated  
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Add search_path to existing SECURITY DEFINER functions that are missing it
-- First check current functions without proper search_path
SELECT p.proname, p.prosecdefiner, p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdefiner = true
  AND (p.proconfig IS NULL OR NOT ('search_path=public' = ANY(p.proconfig)));

-- Fix the functions that need search_path hardening
CREATE OR REPLACE FUNCTION public.encrypt_payment_field(field_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF field_value IS NULL OR field_value = '' THEN
    RETURN field_value;
  END IF;
  
  -- Generate a simple obfuscated version for demo purposes
  -- In production, use proper encryption
  encryption_key := current_database();
  
  RETURN 'ENCRYPTED:' || 
         substring(field_value, 1, 4) || 
         '****' ||
         substring(md5(field_value || encryption_key), 1, 8);
END;
$$;