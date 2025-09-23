-- Fix RLS security bypass by removing permissive user_can_write() function
-- and ensuring all policies explicitly check user access properly

-- First, create a secure replacement function that always requires user_id parameter
CREATE OR REPLACE FUNCTION public.user_can_write_secure(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    has_valid_payment BOOLEAN := FALSE;
    has_active_trial BOOLEAN := FALSE;
    is_challenge_participant BOOLEAN := FALSE;
BEGIN
    -- Require user_id parameter
    IF user_id_param IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check for valid payment access
    SELECT EXISTS(
        SELECT 1 
        FROM public.payments p
        WHERE p.user_id = user_id_param
          AND p.status IN ('paid', 'demo')
          AND p.access_expires_at > now()
    ) INTO has_valid_payment;
    
    -- Check for active trial
    SELECT EXISTS(
        SELECT 1 FROM user_trials 
        WHERE user_id = user_id_param 
        AND status = 'active' 
        AND trial_end_at > NOW()
    ) INTO has_active_trial;
    
    -- Check challenge participation (as backup access)
    SELECT public.user_is_challenge_participant(user_id_param) INTO is_challenge_participant;
    
    -- Grant access if any condition is met
    RETURN (has_valid_payment OR has_active_trial OR is_challenge_participant);
END;
$$;

-- Remove the zero-argument user_can_write function to prevent bypass
DROP FUNCTION IF EXISTS public.user_can_write();

-- Update RLS policies to use the secure function with explicit user_id parameter
-- user_program_tasks policies
DROP POLICY IF EXISTS "Users can create their own program tasks" ON public.user_program_tasks;
DROP POLICY IF EXISTS "Users can update their own program tasks" ON public.user_program_tasks;
DROP POLICY IF EXISTS "Users can delete their own program tasks" ON public.user_program_tasks;

CREATE POLICY "Users can create their own program tasks" 
ON public.user_program_tasks 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) AND public.user_can_write_secure(auth.uid()));

CREATE POLICY "Users can update their own program tasks" 
ON public.user_program_tasks 
FOR UPDATE 
USING ((auth.uid() = user_id) AND public.user_can_write_secure(auth.uid()));

CREATE POLICY "Users can delete their own program tasks" 
ON public.user_program_tasks 
FOR DELETE 
USING ((auth.uid() = user_id) AND public.user_can_write_secure(auth.uid()));

-- community_comments policies
DROP POLICY IF EXISTS "Users can create comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.community_comments;

CREATE POLICY "Users can create comments" 
ON public.community_comments 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) AND public.user_can_write_secure(auth.uid()));

CREATE POLICY "Users can update their own comments" 
ON public.community_comments 
FOR UPDATE 
USING ((auth.uid() = user_id) AND public.user_can_write_secure(auth.uid()));

CREATE POLICY "Users can delete their own comments" 
ON public.community_comments 
FOR DELETE 
USING ((auth.uid() = user_id) AND public.user_can_write_secure(auth.uid()));

-- community_reactions policies
DROP POLICY IF EXISTS "Users can create their own reactions" ON public.community_reactions;

CREATE POLICY "Users can create their own reactions" 
ON public.community_reactions 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) AND public.user_can_write_secure(auth.uid()));

-- networking_event_contacts policies  
DROP POLICY IF EXISTS "Users can insert their own networking event contacts" ON public.networking_event_contacts;
DROP POLICY IF EXISTS "Users can update their own networking event contacts" ON public.networking_event_contacts;
DROP POLICY IF EXISTS "Users can delete their own networking event contacts" ON public.networking_event_contacts;

CREATE POLICY "Users can insert their own networking event contacts" 
ON public.networking_event_contacts 
FOR INSERT 
WITH CHECK ((EXISTS ( SELECT 1
   FROM networking_events ne
  WHERE ((ne.id = networking_event_contacts.networking_event_id) AND (ne.user_id = auth.uid())))) AND public.user_can_write_secure(auth.uid()));

CREATE POLICY "Users can update their own networking event contacts" 
ON public.networking_event_contacts 
FOR UPDATE 
USING ((EXISTS ( SELECT 1
   FROM networking_events ne
  WHERE ((ne.id = networking_event_contacts.networking_event_id) AND (ne.user_id = auth.uid())))) AND public.user_can_write_secure(auth.uid()));

CREATE POLICY "Users can delete their own networking event contacts" 
ON public.networking_event_contacts 
FOR DELETE 
USING ((EXISTS ( SELECT 1
   FROM networking_events ne
  WHERE ((ne.id = networking_event_contacts.networking_event_id) AND (ne.user_id = auth.uid())))) AND public.user_can_write_secure(auth.uid()));

-- user_weekly_tasks policies
DROP POLICY IF EXISTS "Users can create their weekly tasks" ON public.user_weekly_tasks;
DROP POLICY IF EXISTS "Users can delete their weekly tasks" ON public.user_weekly_tasks;

CREATE POLICY "Users can create their weekly tasks" 
ON public.user_weekly_tasks 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) AND user_can_write_secure(auth.uid()));

CREATE POLICY "Users can delete their weekly tasks" 
ON public.user_weekly_tasks 
FOR DELETE 
USING ((auth.uid() = user_id) AND user_can_write_secure(auth.uid()));