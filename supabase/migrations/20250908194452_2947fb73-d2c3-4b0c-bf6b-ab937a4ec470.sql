-- Create the correct 4-parameter wrapper that matches actual trigger calls
-- Triggers call: award_points(user_id, activity_type, description, metadata)
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_activity_type text,
  p_description text,
  p_metadata jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Call the 5-parameter version with NULL challenge_day
  RETURN public.award_points(
    p_user_id,
    p_activity_type,
    p_description,
    NULL,  -- challenge_day
    p_metadata
  );
END;
$$;