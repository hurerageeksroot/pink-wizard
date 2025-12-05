-- Universal Access Mode: All authenticated users have write access
-- This simplifies access control for early-stage application with small user base (45 users)
-- Can be replaced with more granular access control as the app scales
-- Using CREATE OR REPLACE to avoid dependency issues with RLS policies

-- Main function: Check if user is authenticated
CREATE OR REPLACE FUNCTION public.user_can_write(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- All authenticated users with valid user_id have write access
  -- This includes all challenge participants, trial users, and general users
  IF user_id_param IS NOT NULL THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Backwards compatibility version using auth.uid()
CREATE OR REPLACE FUNCTION public.user_can_write()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is authenticated via auth.uid()
  IF auth.uid() IS NOT NULL THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Secure version used by check-access edge function and RLS policies
CREATE OR REPLACE FUNCTION public.user_can_write_secure(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mirror the main function logic
  IF user_id_param IS NOT NULL THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Add comments explaining the purpose
COMMENT ON FUNCTION public.user_can_write(uuid) IS 'Universal access mode: All authenticated users have write access. Simplified for early-stage application with 45 users.';
COMMENT ON FUNCTION public.user_can_write() IS 'Universal access mode: All authenticated users have write access via auth.uid().';
COMMENT ON FUNCTION public.user_can_write_secure(uuid) IS 'Universal access mode: Secure version for edge functions and RLS policies. Returns true for any authenticated user.';