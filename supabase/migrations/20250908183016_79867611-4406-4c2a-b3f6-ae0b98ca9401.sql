-- Fix security issues by setting proper search_path on functions

-- Fix the award_points function
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_activity_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_challenge_day INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS INTEGER AS $$
DECLARE
  points_to_award INTEGER := 0;
  activity_config RECORD;
BEGIN
  -- Get points configuration for this activity type
  SELECT points, is_active INTO activity_config
  FROM public.points_config 
  WHERE activity_type = p_activity_type 
  LIMIT 1;
  
  -- Use default points if no config found
  points_to_award := COALESCE(activity_config.points, 
    CASE p_activity_type
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
    END
  );
  
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Fix the check_milestone_bonuses_intelligent function
CREATE OR REPLACE FUNCTION public.check_milestone_bonuses_intelligent(p_user_id UUID, p_new_total_points INTEGER)
RETURNS JSONB AS $$
DECLARE
  milestone_levels INTEGER[] := ARRAY[100, 500, 1000, 2500, 5000];
  milestone_level INTEGER;
  milestone_key TEXT;
  awarded_bonuses JSONB := '[]'::jsonb;
  bonus_info JSONB;
BEGIN
  -- Only check milestones if we haven't checked recently (throttle)
  IF EXISTS (
    SELECT 1 FROM public.user_points_ledger 
    WHERE user_id = p_user_id 
      AND activity_type LIKE 'milestone_bonus_%'
      AND created_at > now() - INTERVAL '1 hour'
  ) THEN
    RETURN awarded_bonuses;
  END IF;
  
  -- Check each milestone level
  FOREACH milestone_level IN ARRAY milestone_levels
  LOOP
    milestone_key := 'milestone_bonus_' || milestone_level::text;
    
    -- Award milestone if user has reached it and hasn't received it yet
    IF p_new_total_points >= milestone_level AND NOT EXISTS (
      SELECT 1 FROM public.user_points_ledger 
      WHERE user_id = p_user_id 
        AND activity_type = milestone_key
    ) THEN
      -- Award the milestone bonus
      PERFORM public.award_points(
        p_user_id,
        milestone_key,
        milestone_level || ' points milestone reached!'
      );
      
      bonus_info := jsonb_build_object(
        'type', milestone_key,
        'description', milestone_level || ' points milestone reached!',
        'points', milestone_level / 10
      );
      
      awarded_bonuses := awarded_bonuses || bonus_info;
    END IF;
  END LOOP;
  
  RETURN awarded_bonuses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Fix the trigger function
CREATE OR REPLACE FUNCTION public.trigger_milestone_check()
RETURNS TRIGGER AS $$
DECLARE
  user_total_points INTEGER;
BEGIN
  -- Only check for milestone-eligible activity types (not for milestone bonuses themselves)
  IF NEW.activity_type NOT LIKE 'milestone_bonus_%' THEN
    -- Get user's total points efficiently
    SELECT COALESCE(SUM(points_earned), 0)::INTEGER
    INTO user_total_points
    FROM public.user_points_ledger 
    WHERE user_id = NEW.user_id;
    
    -- Check milestones intelligently (throttled)
    PERFORM public.check_milestone_bonuses_intelligent(NEW.user_id, user_total_points);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;