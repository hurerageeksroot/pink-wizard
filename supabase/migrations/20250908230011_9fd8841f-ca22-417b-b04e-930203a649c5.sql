-- Fix user_roles RLS policies
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create granular RLS policies for user_roles
CREATE POLICY "Admins can select all user roles" 
ON public.user_roles 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (is_admin());

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Restrict email sequences and steps to admin only
DROP POLICY IF EXISTS "Anyone can view active email sequences" ON public.email_sequences;
DROP POLICY IF EXISTS "Anyone can view active email sequence steps" ON public.email_sequence_steps;

CREATE POLICY "Admins can manage email sequences" 
ON public.email_sequences 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Admins can manage email sequence steps" 
ON public.email_sequence_steps 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

-- Fix SECURITY DEFINER functions missing search_path
CREATE OR REPLACE FUNCTION public.encrypt_payment_identifiers()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Only encrypt if values are not already encrypted (don't double-encrypt)
  IF NEW.stripe_session_id IS NOT NULL AND NEW.stripe_session_id NOT LIKE '%:%' THEN
    NEW.stripe_session_id := public.encrypt_payment_field(NEW.stripe_session_id);
  END IF;
  
  IF NEW.stripe_payment_intent_id IS NOT NULL AND NEW.stripe_payment_intent_id NOT LIKE '%:%' THEN
    NEW.stripe_payment_intent_id := public.encrypt_payment_field(NEW.stripe_payment_intent_id);
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_payment_operations()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.payment_audit_log (
    user_id, 
    payment_id, 
    action, 
    accessed_fields,
    created_at
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE 
      WHEN TG_OP = 'INSERT' THEN ARRAY['all_fields']
      WHEN TG_OP = 'UPDATE' THEN ARRAY['status', 'access_expires_at']
      WHEN TG_OP = 'DELETE' THEN ARRAY['payment_deleted']
      ELSE ARRAY['unknown']
    END,
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_user_trial()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Ensure user_id matches authenticated user for non-service operations
  IF auth.role() != 'service_role' AND NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Normalize start/end window
    IF NEW.trial_start_at IS NULL THEN
      NEW.trial_start_at := now();
    END IF;
    NEW.trial_end_at := NEW.trial_start_at + interval '14 days';

    -- Only allow 'active' at creation (users cannot self-insert expired/canceled)
    IF auth.role() != 'service_role' THEN
      NEW.status := 'active';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Keep updated_at fresh
    NEW.updated_at := now();

    -- Prevent changing critical fields by non-service role
    IF auth.role() != 'service_role' THEN
      IF NEW.user_id <> OLD.user_id THEN
        RAISE EXCEPTION 'Cannot change user_id';
      END IF;
      IF NEW.trial_start_at <> OLD.trial_start_at OR NEW.trial_end_at <> OLD.trial_end_at THEN
        RAISE EXCEPTION 'Cannot modify trial start/end';
      END IF;
      -- Allow users to cancel their trial (set status to 'canceled'), forbid other arbitrary statuses
      IF NEW.status NOT IN ('active','canceled') THEN
        RAISE EXCEPTION 'Invalid status update';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_subscriber_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Ensure user_id is never NULL
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be NULL for security reasons';
  END IF;
  
  -- Ensure email is provided
  IF NEW.email IS NULL OR trim(NEW.email) = '' THEN
    RAISE EXCEPTION 'email cannot be NULL or empty';
  END IF;
  
  -- Normalize email to lowercase for consistency
  NEW.email := lower(trim(NEW.email));
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_payment_integrity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Prevent modification of critical payment data after creation
  IF TG_OP = 'UPDATE' THEN
    -- Allow user_id updates for linking payments (when going from NULL to a value)
    -- and status/expiration changes, but prevent other critical field modifications
    IF OLD.email != NEW.email OR 
       OLD.amount != NEW.amount OR 
       OLD.stripe_session_id != NEW.stripe_session_id OR
       OLD.stripe_payment_intent_id != NEW.stripe_payment_intent_id OR
       (OLD.user_id IS NOT NULL AND OLD.user_id != NEW.user_id) THEN
      RAISE EXCEPTION 'Critical payment data cannot be modified after creation';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_subscriber_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.payment_audit_log (
    user_id, action, accessed_fields, created_at
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP || '_subscriber_data',
    ARRAY['email', 'stripe_customer_id', 'subscription_tier'],
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_weekly_tasks_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enhanced_auto_secure_new_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Only create vault entry for new payments with Stripe identifiers
  IF (NEW.stripe_session_id IS NOT NULL OR NEW.stripe_payment_intent_id IS NOT NULL) THEN
    INSERT INTO public.payment_vault (
      payment_id,
      secure_stripe_session,
      secure_stripe_intent,
      data_integrity_hash
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.stripe_session_id IS NOT NULL THEN
          public.enhanced_encrypt_payment_field(NEW.stripe_session_id, 'session')
        ELSE NULL
      END,
      CASE 
        WHEN NEW.stripe_payment_intent_id IS NOT NULL THEN
          public.enhanced_encrypt_payment_field(NEW.stripe_payment_intent_id, 'intent')
        ELSE NULL
      END,
      extensions.digest(
        COALESCE(NEW.email, '') || 
        COALESCE(NEW.amount::text, '') || 
        COALESCE(NEW.currency, ''),
        'md5'
      )
    ) ON CONFLICT (payment_id) DO UPDATE SET
      secure_stripe_session = EXCLUDED.secure_stripe_session,
      secure_stripe_intent = EXCLUDED.secure_stripe_intent,
      data_integrity_hash = EXCLUDED.data_integrity_hash;
  END IF;
  
  -- Log the secure payment creation
  PERFORM public.secure_audit_payment_access(
    NEW.id,
    'secure_payment_created',
    'automated_trigger'
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_user_data_integrity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Ensure user_id is never NULL and matches authenticated user for user operations
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be NULL for security reasons';
  END IF;
  
  -- For non-service-role operations, ensure user_id matches authenticated user
  IF auth.role() != 'service_role' AND NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;
  
  RETURN NEW;
END;
$function$;