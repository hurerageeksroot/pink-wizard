-- Create 4-parameter backward-compatible wrapper for award_points
-- This allows existing triggers to continue working with the new 5-parameter function
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_activity_type text,
  p_description text,
  p_challenge_day integer DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Call the 5-parameter version with empty metadata
  RETURN public.award_points(
    p_user_id,
    p_activity_type,
    p_description,
    p_challenge_day,
    '{}'::jsonb
  );
END;
$$;