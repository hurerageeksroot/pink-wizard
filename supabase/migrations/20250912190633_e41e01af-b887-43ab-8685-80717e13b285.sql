-- Simplify gamification system - Phase 1: Database-level automation

-- First, add missing activity type weights
INSERT INTO activity_weights (activity_type, weight, description, is_active) VALUES
  ('email', 15, 'Email touchpoints', true),
  ('call', 25, 'Phone call touchpoints', true),
  ('meeting', 35, 'In-person or video meetings', true),
  ('revenue', 1, 'Revenue tracking (handled separately)', true)
ON CONFLICT (activity_type) DO UPDATE SET
  weight = EXCLUDED.weight,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Create simplified award_points function that always works
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_activity_type text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_challenge_day integer DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  weight_multiplier NUMERIC;
  points_earned INTEGER;
BEGIN
  -- Get weight for this activity type
  SELECT weight INTO weight_multiplier
  FROM public.activity_weights 
  WHERE activity_type = p_activity_type AND is_active = true
  LIMIT 1;
  
  -- Default to 10 points if no weight found
  weight_multiplier := COALESCE(weight_multiplier, 10.0);
  points_earned := weight_multiplier::INTEGER;
  
  -- Insert points (ignore duplicates to prevent double-awarding)
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
    points_earned,
    p_description,
    p_metadata,
    p_challenge_day,
    now()
  );
  
  -- Update leaderboard stats
  PERFORM public.update_leaderboard_stats(p_user_id);
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE LOG 'award_points error for user % activity %: %', p_user_id, p_activity_type, SQLERRM;
  RETURN false;
END;
$$;

-- Create trigger function for activities
CREATE OR REPLACE FUNCTION public.auto_award_activity_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Award points for new activities only
  IF TG_OP = 'INSERT' THEN
    PERFORM public.award_points(
      NEW.user_id,
      NEW.type,
      'Activity: ' || NEW.title,
      jsonb_build_object(
        'activity_id', NEW.id,
        'contact_id', NEW.contact_id,
        'response_received', NEW.response_received
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger function for contacts  
CREATE OR REPLACE FUNCTION public.auto_award_contact_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Award points for new contacts only
  IF TG_OP = 'INSERT' THEN
    PERFORM public.award_points(
      NEW.user_id,
      'contact_added',
      'New contact: ' || NEW.name,
      jsonb_build_object(
        'contact_id', NEW.id,
        'company', NEW.company,
        'status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the triggers
DROP TRIGGER IF EXISTS trigger_award_activity_points ON activities;
CREATE TRIGGER trigger_award_activity_points
  AFTER INSERT ON activities
  FOR EACH ROW
  EXECUTE FUNCTION auto_award_activity_points();

DROP TRIGGER IF EXISTS trigger_award_contact_points ON contacts;
CREATE TRIGGER trigger_award_contact_points
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION auto_award_contact_points();