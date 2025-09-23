-- Fix the award_points function ambiguity by creating ONE clean function

-- Drop all existing award_points functions (this will handle all overloads)
DROP FUNCTION IF EXISTS public.award_points(uuid, text, text);
DROP FUNCTION IF EXISTS public.award_points(uuid, text, text, jsonb);
DROP FUNCTION IF EXISTS public.award_points(uuid, text, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.award_points(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.award_points(uuid, text, text, text, integer, jsonb);

-- Create ONE canonical award_points function
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_activity_type text,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}',
  p_challenge_day integer DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  points_to_award INTEGER := 0;
  weight_multiplier NUMERIC;
BEGIN
  -- Validate input
  IF p_user_id IS NULL OR p_activity_type IS NULL THEN
    RETURN 0;
  END IF;

  -- Try to get points from activity_weights table first
  SELECT weight INTO weight_multiplier
  FROM public.activity_weights 
  WHERE activity_type = p_activity_type AND is_active = true
  LIMIT 1;
  
  IF weight_multiplier IS NOT NULL THEN
    points_to_award := weight_multiplier::INTEGER;
  ELSE
    -- Fallback to hardcoded values for common activity types
    points_to_award := CASE p_activity_type
      WHEN 'contact_added' THEN 10
      WHEN 'activity_logged' THEN 5
      WHEN 'touchpoint_logged' THEN 5
      WHEN 'contact_won' THEN 50
      WHEN 'contact_response' THEN 15
      WHEN 'networking_event' THEN 20
      WHEN 'community_post' THEN 10
      WHEN 'community_comment' THEN 5
      WHEN 'community_reaction' THEN 2
      WHEN 'weekly_outreach_bonus' THEN 100
      WHEN 'weekly_wins_bonus' THEN 150
      WHEN 'streak_bonus_7' THEN 50
      WHEN 'streak_bonus_14' THEN 100
      WHEN 'streak_bonus_30' THEN 300
      WHEN 'milestone_bonus' THEN 100
      ELSE 10
    END;
  END IF;
  
  -- Don't award negative or zero points
  IF points_to_award <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Insert points entry (with conflict handling for milestone bonuses)
  IF p_activity_type LIKE 'milestone_bonus%' OR p_activity_type LIKE '%_bonus' THEN
    -- Use conflict-safe insert for bonus types
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
      COALESCE(p_description, 'Points awarded for ' || p_activity_type), 
      p_challenge_day, 
      COALESCE(p_metadata, '{}')
    )
    ON CONFLICT ON CONSTRAINT unique_milestone_bonus DO NOTHING;
  ELSE
    -- Regular insert for normal activities
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
      COALESCE(p_description, 'Points awarded for ' || p_activity_type), 
      p_challenge_day, 
      COALESCE(p_metadata, '{}')
    );
  END IF;
  
  RETURN points_to_award;
  
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the operation
  RAISE WARNING 'Error in award_points for user % activity %: %', p_user_id, p_activity_type, SQLERRM;
  RETURN 0;
END;
$$;