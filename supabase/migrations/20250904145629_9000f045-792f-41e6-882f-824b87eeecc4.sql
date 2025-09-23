-- Fix the challenge participant and access control functions
-- The issue is that these functions rely on auth.uid() which may not work properly from edge functions

-- First, let's recreate the user_is_challenge_participant function to be more explicit
CREATE OR REPLACE FUNCTION user_is_challenge_participant(user_id_param UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
    is_participant BOOLEAN := FALSE;
BEGIN
    -- Use provided user_id or fall back to auth.uid()
    target_user_id := COALESCE(user_id_param, auth.uid());
    
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has active challenge progress and challenge is currently active
    SELECT EXISTS(
        SELECT 1 
        FROM user_challenge_progress ucp
        JOIN challenge_config cc ON cc.is_active = true
        WHERE ucp.user_id = target_user_id
          AND ucp.is_active = true
          AND CURRENT_DATE BETWEEN cc.start_date AND cc.end_date
    ) INTO is_participant;
    
    RETURN is_participant;
END;
$$;

-- Fix the user_can_write function to also accept a user_id parameter  
CREATE OR REPLACE FUNCTION user_can_write(user_id_param UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
    has_access BOOLEAN := FALSE;
BEGIN
    -- Use provided user_id or fall back to auth.uid()
    target_user_id := COALESCE(user_id_param, auth.uid());
    
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check various access methods
    -- 1. Active subscription
    IF EXISTS(
        SELECT 1 FROM subscribers 
        WHERE user_id = target_user_id 
        AND subscribed = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- 2. Valid payment
    IF EXISTS(
        SELECT 1 FROM payments 
        WHERE user_id = target_user_id 
        AND status IN ('paid', 'demo')
        AND access_expires_at > NOW()
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- 3. Active trial
    IF EXISTS(
        SELECT 1 FROM user_trials 
        WHERE user_id = target_user_id 
        AND status = 'active' 
        AND trial_end_at > NOW()
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- 4. Challenge participant
    IF user_is_challenge_participant(target_user_id) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Also create a helper function for user_has_active_trial
CREATE OR REPLACE FUNCTION user_has_active_trial(user_id_param UUID DEFAULT NULL)
RETURNS BOOLEAN
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
    
    RETURN EXISTS(
        SELECT 1 FROM user_trials 
        WHERE user_id = target_user_id 
        AND status = 'active' 
        AND trial_end_at > NOW()
    );
END;
$$;