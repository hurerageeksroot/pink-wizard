-- Find and fix all functions that might not have proper search_path settings
-- This addresses the persistent Function Search Path Mutable security warning

-- Check what functions exist and fix their search paths
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Get all functions that don't have search_path set to empty string
    FOR func_record IN 
        SELECT 
            p.proname as function_name,
            n.nspname as schema_name,
            pg_get_function_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.prosecdef = true  -- SECURITY DEFINER functions
        AND (p.proconfig IS NULL OR 
             NOT EXISTS (
                 SELECT 1 FROM unnest(p.proconfig) as config 
                 WHERE config LIKE 'search_path=%'
             ))
    LOOP
        RAISE NOTICE 'Function needs search_path fix: %.%(%) ', 
            func_record.schema_name, 
            func_record.function_name, 
            func_record.arguments;
    END LOOP;
END $$;

-- Fix remaining functions that need proper search_path settings
-- Update check_and_award_badges function
CREATE OR REPLACE FUNCTION public.check_and_award_badges(
  p_user_id uuid,
  p_event_type text,
  p_event_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  awarded_badges jsonb[] := '{}';
  badge_record RECORD;
  criteria jsonb;
  meets_criteria boolean;
  user_count integer;
  activity_count integer;
  points_total integer;
  networking_count integer;
  response_rate numeric;
  current_streak integer;
BEGIN
  -- Get user's current stats for badge criteria evaluation
  SELECT COUNT(*) INTO activity_count
  FROM public.activities
  WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(points_earned), 0) INTO points_total
  FROM public.user_points_ledger
  WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO networking_count
  FROM public.networking_events
  WHERE user_id = p_user_id;

  -- Get current streak from leaderboard stats
  SELECT ls.current_streak INTO current_streak
  FROM public.leaderboard_stats ls
  WHERE ls.user_id = p_user_id;
  
  current_streak := COALESCE(current_streak, 0);

  -- Calculate response rate
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE response_received = true)::numeric / COUNT(*)::numeric) * 100
      ELSE 0 
    END INTO response_rate
  FROM public.contacts
  WHERE user_id = p_user_id;

  -- Check each active badge for eligibility
  FOR badge_record IN 
    SELECT id, name, criteria, points_reward
    FROM public.badges_definition
    WHERE is_active = true
  LOOP
    criteria := badge_record.criteria;
    meets_criteria := false;

    -- Evaluate badge criteria based on type
    IF criteria->>'type' = 'activity_count' THEN
      meets_criteria := activity_count >= (criteria->>'threshold')::integer;
    ELSIF criteria->>'type' = 'points_total' THEN
      meets_criteria := points_total >= (criteria->>'threshold')::integer;
    ELSIF criteria->>'type' = 'networking_events' THEN
      meets_criteria := networking_count >= (criteria->>'threshold')::integer;
    ELSIF criteria->>'type' = 'response_rate' THEN
      meets_criteria := response_rate >= (criteria->>'threshold')::numeric;
    ELSIF criteria->>'type' = 'streak_days' THEN
      meets_criteria := current_streak >= (criteria->>'threshold')::integer;
    ELSIF criteria->>'type' = 'event_specific' THEN
      meets_criteria := (criteria->>'event_type') = p_event_type;
    END IF;

    -- Award badge if criteria met and not already earned
    IF meets_criteria AND NOT EXISTS (
      SELECT 1 FROM public.user_badges 
      WHERE user_id = p_user_id AND badge_id = badge_record.id
    ) THEN
      -- Insert badge award
      INSERT INTO public.user_badges (user_id, badge_id, earned_at)
      VALUES (p_user_id, badge_record.id, now());

      -- Award points if specified
      IF badge_record.points_reward > 0 THEN
        INSERT INTO public.user_points_ledger (
          user_id, activity_type, points_earned, 
          description, metadata
        ) VALUES (
          p_user_id, 'badge_earned', badge_record.points_reward,
          'Badge earned: ' || badge_record.name,
          jsonb_build_object('badge_id', badge_record.id, 'badge_name', badge_record.name)
        );
      END IF;

      -- Add to awarded badges array
      awarded_badges := awarded_badges || jsonb_build_object(
        'badge_id', badge_record.id,
        'badge_name', badge_record.name,
        'points_awarded', COALESCE(badge_record.points_reward, 0)
      );
    END IF;
  END LOOP;

  RETURN awarded_badges;
END;
$$;