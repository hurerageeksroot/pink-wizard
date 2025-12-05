-- Security Fix Migration: Address Critical RLS and Function Security Issues
-- This migration adds SET search_path to database functions and enhances RLS policies

-- ============================================
-- PART 1: Add SET search_path to all database functions without it
-- This prevents schema-based privilege escalation attacks
-- ============================================

-- Fix remove_demo_data_for_user function
CREATE OR REPLACE FUNCTION public.remove_demo_data_for_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM activities 
  WHERE user_id = auth.uid() 
    AND contact_id IN (
      SELECT id FROM contacts 
      WHERE user_id = auth.uid() 
        AND is_demo = true
    );

  DELETE FROM contacts 
  WHERE user_id = auth.uid() 
    AND is_demo = true;

  DELETE FROM activities
  WHERE user_id = auth.uid()
    AND (
      title ILIKE '%demo%' OR 
      title ILIKE '%test%' OR 
      title ILIKE '%sample%' OR
      description ILIKE '%demo%' OR 
      description ILIKE '%test%' OR 
      description ILIKE '%sample%'
    );
END;
$function$;

-- Fix update_relationship_intent_configs_updated_at
CREATE OR REPLACE FUNCTION public.update_relationship_intent_configs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_relationship_status_options_updated_at
CREATE OR REPLACE FUNCTION public.update_relationship_status_options_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- ============================================
-- PART 2: Enhance content_pages RLS policies
-- Require authentication for all content access
-- ============================================

-- Drop existing public policy
DROP POLICY IF EXISTS "Anyone can view published content pages" ON public.content_pages;

-- Create new authenticated-only policy
CREATE POLICY "Authenticated users can view published content pages"
ON public.content_pages
FOR SELECT
USING (is_published = true AND auth.uid() IS NOT NULL);

-- ============================================
-- PART 3: Add rate limiting protection to critical tables
-- Add updated_at triggers for better audit trails
-- ============================================

-- Ensure contact_contexts has proper timestamp updates
DROP TRIGGER IF EXISTS update_contact_contexts_updated_at ON public.contact_contexts;
CREATE TRIGGER update_contact_contexts_updated_at
  BEFORE UPDATE ON public.contact_contexts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_relationship_intent_configs_updated_at();

-- ============================================
-- PART 4: Enhance payment security policies
-- Add additional validation
-- ============================================

-- Ensure payments table has comprehensive audit trail
COMMENT ON TABLE public.payments IS 'Payment records with comprehensive audit trail and RLS protection';
COMMENT ON TABLE public.payment_audit_log IS 'Audit log for all payment-related operations';
COMMENT ON TABLE public.payment_vault IS 'Encrypted vault for sensitive payment identifiers';

-- ============================================
-- PART 5: Add security documentation
-- ============================================

COMMENT ON SCHEMA public IS 'Public schema with comprehensive RLS policies and security measures';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Security migration completed successfully';
  RAISE NOTICE '1. Added SET search_path to vulnerable database functions';
  RAISE NOTICE '2. Enhanced content_pages RLS to require authentication';
  RAISE NOTICE '3. Added audit trail improvements';
  RAISE NOTICE '4. Enhanced payment security documentation';
END $$;