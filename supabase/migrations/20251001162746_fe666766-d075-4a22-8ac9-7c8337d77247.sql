-- Fix award_points function to use parameterless update_leaderboard_stats()
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_activity_type text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  points_value integer;
  challenge_day_val integer;
BEGIN
  -- Get points value for this activity type
  SELECT points INTO points_value
  FROM public.points_values
  WHERE activity_type = p_activity_type AND is_active = true
  LIMIT 1;

  -- Default to 10 points if not found
  points_value := COALESCE(points_value, 10);

  -- Get current challenge day
  SELECT current_day INTO challenge_day_val
  FROM public.challenge_config
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  challenge_day_val := COALESCE(challenge_day_val, 1);

  -- Insert points record
  INSERT INTO public.user_points_ledger (
    user_id,
    activity_type,
    points_earned,
    description,
    metadata,
    challenge_day,
    created_at
  ) VALUES (
    p_user_id,
    p_activity_type,
    points_value,
    p_description,
    p_metadata,
    challenge_day_val,
    now()
  );

  -- Update leaderboard stats (parameterless version)
  PERFORM public.update_leaderboard_stats();

  -- Check for badges
  PERFORM public.check_and_award_badges(p_user_id, p_activity_type, p_metadata);

  -- Check for variable rewards
  PERFORM public.process_variable_reward(p_user_id, p_activity_type, p_metadata);

  RETURN true;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in award_points: %', SQLERRM;
    RETURN false;
END;
$function$;