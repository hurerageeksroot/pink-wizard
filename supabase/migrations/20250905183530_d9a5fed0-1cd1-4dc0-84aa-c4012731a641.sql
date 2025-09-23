-- Simplify access control - give all authenticated users full access during trial
-- Remove complex layered access restrictions that cause errors

-- Update user_can_write function to be much simpler
CREATE OR REPLACE FUNCTION public.user_can_write(user_id_param uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Use provided user_id or fall back to auth.uid()
    target_user_id := COALESCE(user_id_param, auth.uid());
    
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- For now, all authenticated users have write access
    -- This eliminates the complex layered access system
    RETURN TRUE;
END;
$$;

-- Also create the simpler parameterless version
CREATE OR REPLACE FUNCTION public.user_can_write()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = PUBLIC
AS $$
BEGIN
    -- Simple: all authenticated users have access
    RETURN auth.uid() IS NOT NULL;
END;
$$;