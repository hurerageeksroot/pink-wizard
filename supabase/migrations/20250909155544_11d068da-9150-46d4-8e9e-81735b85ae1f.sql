-- Fix search path security issue for get_active_challenge_participant_count function
CREATE OR REPLACE FUNCTION public.get_active_challenge_participant_count()
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  participant_count INTEGER;
BEGIN
  -- Get count of users with active challenge progress
  SELECT COUNT(*)
  INTO participant_count
  FROM public.user_challenge_progress ucp
  WHERE ucp.is_active = true;
  
  RETURN COALESCE(participant_count, 0);
END;
$function$;