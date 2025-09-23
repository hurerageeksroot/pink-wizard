-- Clean up duplicate award_points functions and create single correct version
-- First, drop all existing award_points functions
DROP FUNCTION IF EXISTS public.award_points(uuid, text, text, jsonb);
DROP FUNCTION IF EXISTS public.award_points(uuid, text, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.award_points(uuid, text, text, jsonb, integer);

-- Create the single, correct award_points function with proper signature
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
SET search_path = 'public'
AS $$
DECLARE
  points_to_award integer := 0;
  weight_multiplier numeric;
  inserted_points integer := 0;
BEGIN
  -- Validate input
  IF p_user_id IS NULL OR p_activity_type IS NULL THEN
    RAISE WARNING 'Invalid input: user_id=%, activity_type=%', p_user_id, p_activity_type;
    RETURN 0;
  END IF;

  RAISE LOG 'award_points called: user_id=%, activity_type=%, description=%', p_user_id, p_activity_type, p_description;

  -- Try to get points from activity_weights table first
  SELECT weight INTO weight_multiplier
  FROM public.activity_weights 
  WHERE activity_type = p_activity_type AND is_active = true
  LIMIT 1;
  
  IF weight_multiplier IS NOT NULL THEN
    points_to_award := weight_multiplier::integer;
    RAISE LOG 'Found weight in activity_weights: %', weight_multiplier;
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
    RAISE LOG 'Using fallback points: %', points_to_award;
  END IF;
  
  -- Don't award negative or zero points
  IF points_to_award <= 0 THEN
    RAISE LOG 'Points to award is <= 0: %', points_to_award;
    RETURN 0;
  END IF;
  
  -- Insert points entry with proper error handling
  BEGIN
    INSERT INTO public.user_points_ledger (
      user_id, 
      activity_type, 
      points_earned, 
      description, 
      challenge_day, 
      metadata,
      created_at
    ) VALUES (
      p_user_id, 
      p_activity_type, 
      points_to_award, 
      COALESCE(p_description, 'Points awarded for ' || p_activity_type), 
      p_challenge_day, 
      p_metadata,
      now()
    )
    RETURNING points_earned INTO inserted_points;
    
    RAISE LOG 'Successfully inserted % points', inserted_points;
    
    -- Update leaderboard stats
    PERFORM public.update_leaderboard_stats(p_user_id);
    
    RETURN inserted_points;
    
  EXCEPTION 
    WHEN unique_violation THEN
      -- Handle duplicate entries gracefully
      RAISE LOG 'Duplicate points entry avoided for user % activity %', p_user_id, p_activity_type;
      RETURN 0;
    WHEN OTHERS THEN
      -- Log the error but don't fail the calling operation
      RAISE WARNING 'Error in award_points for user % activity %: %', p_user_id, p_activity_type, SQLERRM;
      RETURN 0;
  END;
END;
$$;