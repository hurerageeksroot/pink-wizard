-- Create unique index on user_challenge_progress to prevent duplicate active participants
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_challenge_progress_user_active 
ON public.user_challenge_progress (user_id) 
WHERE is_active = true;

-- Update the RPC function to handle both array and single object responses
CREATE OR REPLACE FUNCTION public.user_is_challenge_participant(user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF user_id_param IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS(
    SELECT 1 FROM public.user_challenge_progress 
    WHERE user_id = user_id_param AND is_active = true
  );
END;
$$;