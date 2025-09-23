-- Fix milestone bonus race conditions and make system idempotent

-- Drop any remaining triggers that could cause conflicts
DROP TRIGGER IF EXISTS milestone_bonus_trigger ON user_points_ledger;
DROP TRIGGER IF EXISTS auto_milestone_check ON user_points_ledger;

-- Create or replace the award_points function to be conflict-safe
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_activity_type text,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  points_to_award INTEGER;
  awarded_points INTEGER := 0;
  result jsonb;
BEGIN
  -- Get points for this activity type
  SELECT points INTO points_to_award
  FROM public.activity_points_config
  WHERE activity_type = p_activity_type AND is_active = true
  LIMIT 1;
  
  -- Default to 0 if no points configuration found
  points_to_award := COALESCE(points_to_award, 0);
  
  -- Only insert if points > 0
  IF points_to_award > 0 THEN
    -- Use conflict-safe insert for milestone bonuses
    IF p_activity_type LIKE '%milestone%' OR p_activity_type LIKE '%bonus%' THEN
      INSERT INTO public.user_points_ledger (
        user_id, 
        activity_type, 
        points_earned, 
        description,
        metadata
      ) VALUES (
        p_user_id, 
        p_activity_type, 
        points_to_award, 
        COALESCE(p_description, 'Points awarded for ' || p_activity_type),
        jsonb_build_object(
          'awarded_at', now(),
          'conflict_safe', true
        )
      )
      ON CONFLICT ON CONSTRAINT unique_milestone_bonus DO NOTHING
      RETURNING points_earned INTO awarded_points;
      
      -- If no points were awarded due to conflict, return existing record info
      IF awarded_points IS NULL THEN
        awarded_points := 0;
      END IF;
    ELSE
      -- Regular points (non-milestone) - allow duplicates
      INSERT INTO public.user_points_ledger (
        user_id, 
        activity_type, 
        points_earned, 
        description
      ) VALUES (
        p_user_id, 
        p_activity_type, 
        points_to_award, 
        COALESCE(p_description, 'Points awarded for ' || p_activity_type)
      )
      RETURNING points_earned INTO awarded_points;
    END IF;
  END IF;
  
  result := jsonb_build_object(
    'success', true,
    'points_awarded', awarded_points,
    'activity_type', p_activity_type,
    'description', COALESCE(p_description, 'Points awarded for ' || p_activity_type)
  );
  
  RETURN result;
  
EXCEPTION 
  WHEN unique_violation THEN
    -- Handle any remaining unique violations gracefully
    RETURN jsonb_build_object(
      'success', true,
      'points_awarded', 0,
      'activity_type', p_activity_type,
      'message', 'Points already awarded',
      'description', COALESCE(p_description, 'Points awarded for ' || p_activity_type)
    );
  WHEN OTHERS THEN
    -- Log the error but don't fail the transaction
    RETURN jsonb_build_object(
      'success', false,
      'points_awarded', 0,
      'activity_type', p_activity_type,
      'error', SQLERRM,
      'description', COALESCE(p_description, 'Points awarded for ' || p_activity_type)
    );
END;
$$;