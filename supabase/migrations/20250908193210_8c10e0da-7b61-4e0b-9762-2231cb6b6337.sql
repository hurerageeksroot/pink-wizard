-- Drop duplicate award_points functions
DROP FUNCTION IF EXISTS public.award_points(uuid, text, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.award_points(uuid, text, text, jsonb, integer);

-- Create a single, consolidated award_points function
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_activity_type text,
  p_description text DEFAULT NULL,
  p_challenge_day integer DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  points_to_award INTEGER := 0;
  activity_config RECORD;
  weight_multiplier NUMERIC;
BEGIN
  -- First try to get points from points_config table
  SELECT points, is_active INTO activity_config
  FROM public.points_config 
  WHERE activity_type = p_activity_type AND is_active = true
  LIMIT 1;
  
  IF activity_config.points IS NOT NULL THEN
    points_to_award := activity_config.points;
  ELSE
    -- Fall back to activity_weights table
    SELECT weight INTO weight_multiplier
    FROM public.activity_weights 
    WHERE activity_type = p_activity_type AND is_active = true
    LIMIT 1;
    
    IF weight_multiplier IS NOT NULL THEN
      points_to_award := weight_multiplier::INTEGER;
    ELSE
      -- Default point values for common activity types
      points_to_award := CASE p_activity_type
        WHEN 'contact_added' THEN 10
        WHEN 'activity_logged' THEN 5
        WHEN 'networking_event' THEN 20
        WHEN 'weekly_outreach_bonus' THEN 100
        WHEN 'weekly_wins_bonus' THEN 150
        WHEN 'streak_bonus_7' THEN 50
        WHEN 'streak_bonus_14' THEN 100
        WHEN 'streak_bonus_30' THEN 300
        WHEN 'milestone_bonus_100' THEN 50
        WHEN 'milestone_bonus_500' THEN 100
        WHEN 'milestone_bonus_1000' THEN 200
        WHEN 'milestone_bonus_2500' THEN 500
        WHEN 'milestone_bonus_5000' THEN 1000
        ELSE 10
      END;
    END IF;
  END IF;
  
  -- Insert points entry
  INSERT INTO public.user_points_ledger (
    user_id, 
    activity_type, 
    points_earned, 
    description, 
    challenge_day, 
    metadata
  ) VALUES (
    p_user_id, 
    p_activity_type, 
    points_to_award, 
    p_description, 
    p_challenge_day, 
    p_metadata
  );
  
  RETURN points_to_award;
END;
$$;