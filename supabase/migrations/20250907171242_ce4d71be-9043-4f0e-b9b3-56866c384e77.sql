-- Fix user_is_challenge_participant to allow participants to see challenge features even before start date
CREATE OR REPLACE FUNCTION public.user_is_challenge_participant(user_id_param uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    target_user_id UUID;
    s_date date;
    e_date date;
    is_participant boolean := false;
BEGIN
    -- Use provided user_id or fall back to auth.uid()
    target_user_id := COALESCE(user_id_param, auth.uid());
    
    IF target_user_id IS NULL THEN
        RETURN false;
    END IF;

    -- Get current active challenge window (if any)
    SELECT start_date, end_date
    INTO s_date, e_date
    FROM public.challenge_config
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;

    IF s_date IS NULL OR e_date IS NULL THEN
        RETURN false;
    END IF;

    -- Allow participants to see challenge features if:
    -- 1. They have active progress record AND
    -- 2. Current date is before end date (includes pre-start setup period)
    IF CURRENT_DATE <= e_date THEN
        SELECT EXISTS (
            SELECT 1
            FROM public.user_challenge_progress ucp
            WHERE ucp.user_id = target_user_id
                AND ucp.is_active = true
        ) INTO is_participant;

        RETURN COALESCE(is_participant, false);
    END IF;

    RETURN false;
END;
$$;