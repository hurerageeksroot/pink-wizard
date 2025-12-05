-- Fix award_activity_points trigger function to use parameterless update_leaderboard_stats()
CREATE OR REPLACE FUNCTION public.award_activity_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  points_value integer;
  challenge_day_val integer;
BEGIN
  -- Only award points for completed activities
  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get points value based on activity type
  SELECT points INTO points_value
  FROM public.points_values
  WHERE activity_type = NEW.type AND is_active = true
  LIMIT 1;

  -- Default points if not found
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
    NEW.user_id,
    NEW.type,
    points_value,
    'Activity completed: ' || NEW.title,
    jsonb_build_object(
      'activity_id', NEW.id,
      'contact_id', NEW.contact_id
    ),
    challenge_day_val,
    now()
  );

  -- Update leaderboard stats (parameterless version - fixes the error!)
  PERFORM public.update_leaderboard_stats();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in award_activity_points: %', SQLERRM;
    RETURN NEW;
END;
$function$;