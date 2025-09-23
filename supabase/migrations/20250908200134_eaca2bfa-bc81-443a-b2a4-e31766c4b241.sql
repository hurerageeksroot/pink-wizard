-- Fix security warning: Update functions to have proper search_path settings

-- Recreate the check_milestone_bonuses_intelligent function with proper search_path
CREATE OR REPLACE FUNCTION public.check_milestone_bonuses_intelligent(
  p_user_id uuid, 
  p_current_total_points integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  milestone_levels INTEGER[] := ARRAY[100, 500, 1000, 2500, 5000];
  bonus_amounts INTEGER[] := ARRAY[50, 100, 200, 500, 1000];
  milestone INTEGER;
  bonus INTEGER;
  i INTEGER;
BEGIN
  -- Check each milestone level
  FOR i IN 1..array_length(milestone_levels, 1) LOOP
    milestone := milestone_levels[i];
    bonus := bonus_amounts[i];
    
    -- Only award if user has reached milestone and hasn't received this specific bonus yet
    IF p_current_total_points >= milestone THEN
      -- Use INSERT with ON CONFLICT to prevent duplicates
      INSERT INTO public.user_points_ledger (
        user_id,
        activity_type,
        points_earned,
        description,
        metadata
      ) 
      VALUES (
        p_user_id,
        'milestone_bonus_' || milestone,
        bonus,
        'Milestone bonus for reaching ' || milestone || ' points!',
        jsonb_build_object(
          'milestone_level', milestone,
          'bonus_type', 'points_milestone',
          'awarded_at', now()
        )
      )
      ON CONFLICT ON CONSTRAINT unique_milestone_bonus DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Recreate the check_user_milestone_bonuses function with proper search_path
CREATE OR REPLACE FUNCTION public.check_user_milestone_bonuses(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  total_points INTEGER;
BEGIN
  -- Get user's current total points
  SELECT COALESCE(SUM(points_earned), 0)::INTEGER
  INTO total_points
  FROM public.user_points_ledger 
  WHERE user_id = p_user_id;
  
  -- Check milestones
  PERFORM public.check_milestone_bonuses_intelligent(p_user_id, total_points);
END;
$$;