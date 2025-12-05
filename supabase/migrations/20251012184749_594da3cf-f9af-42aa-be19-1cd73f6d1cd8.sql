-- Fix for Renee's "Points system error" - Remove overly-aggressive unique constraint
-- Issue: unique_milestone_bonus constraint uses entire metadata JSON, causing false-positive duplicates

-- Step 1: Drop the problematic constraint
ALTER TABLE public.user_points_ledger 
DROP CONSTRAINT IF EXISTS unique_milestone_bonus;

-- Step 2: Add targeted constraint for milestone bonuses ONLY
-- This prevents duplicate milestone bonuses but allows legitimate badge awards
CREATE UNIQUE INDEX IF NOT EXISTS unique_milestone_level 
ON public.user_points_ledger (user_id, activity_type, ((metadata->>'milestone_level')::integer))
WHERE activity_type = 'milestone_bonus';

-- Step 3: Update check_and_award_badges function with explicit duplicate checking
CREATE OR REPLACE FUNCTION public.check_and_award_badges(
  p_user_id uuid,
  p_event_type text,
  p_event_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  badge_record RECORD;
  awarded_badges jsonb := '[]'::jsonb;
  badge_already_earned boolean;
  points_already_awarded boolean;
BEGIN
  -- Loop through all active badges that match this event type
  FOR badge_record IN
    SELECT bd.* 
    FROM public.badges_definition bd
    WHERE bd.is_active = true
      AND bd.criteria->>'event_type' = p_event_type
  LOOP
    -- Check if badge already earned BEFORE attempting insert
    SELECT EXISTS(
      SELECT 1 FROM public.user_badges 
      WHERE user_id = p_user_id AND badge_id = badge_record.id
    ) INTO badge_already_earned;
    
    IF NOT badge_already_earned THEN
      -- Award the badge
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (p_user_id, badge_record.id);
      
      -- Check if points already awarded for this badge BEFORE inserting
      SELECT EXISTS(
        SELECT 1 FROM public.user_points_ledger
        WHERE user_id = p_user_id 
          AND activity_type = 'badge_earned'
          AND (metadata->>'badge_id')::uuid = badge_record.id
      ) INTO points_already_awarded;
      
      IF NOT points_already_awarded THEN
        -- Award points for the badge
        INSERT INTO public.user_points_ledger (
          user_id,
          activity_type,
          points_earned,
          description,
          metadata
        ) VALUES (
          p_user_id,
          'badge_earned',
          COALESCE(badge_record.points_reward, 0),
          'Earned badge: ' || badge_record.name,
          jsonb_build_object(
            'badge_id', badge_record.id,
            'badge_name', badge_record.name,
            'event_type', p_event_type,
            'event_data', p_event_data
          )
        );
      END IF;
      
      -- Add to awarded badges list
      awarded_badges := awarded_badges || jsonb_build_object(
        'badge_id', badge_record.id,
        'badge_name', badge_record.name,
        'points_earned', COALESCE(badge_record.points_reward, 0),
        'icon_name', badge_record.icon_name,
        'rarity', badge_record.rarity
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'badges_awarded', awarded_badges
  );
EXCEPTION WHEN OTHERS THEN
  -- Log the actual error for debugging
  RAISE WARNING 'check_and_award_badges error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Step 4: Drop and recreate award_points function with better error logging
DROP FUNCTION IF EXISTS public.award_points(uuid, text, integer, text, jsonb, integer);

CREATE FUNCTION public.award_points(
  p_user_id uuid,
  p_activity_type text,
  p_points integer,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_challenge_day integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_points_ledger (
    user_id,
    activity_type,
    points_earned,
    description,
    metadata,
    challenge_day
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_points,
    COALESCE(p_description, 'Points awarded for ' || p_activity_type),
    p_metadata,
    p_challenge_day
  );
  
  -- Invalidate leaderboard cache
  PERFORM update_leaderboard_stats(p_user_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', p_points
  );
EXCEPTION WHEN OTHERS THEN
  -- Log the actual SQL error with SQLSTATE for debugging
  RAISE WARNING 'award_points error for user % activity %: % (SQLSTATE: %)', 
    p_user_id, p_activity_type, SQLERRM, SQLSTATE;
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
END;
$$;