-- Drop existing functions before recreating with fixes
DROP FUNCTION IF EXISTS public.award_points(uuid, text, integer, text, jsonb, integer);
DROP FUNCTION IF EXISTS public.check_and_award_badges(uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.process_variable_reward(uuid, text, jsonb);

-- Fix award_points function to handle duplicate insertions gracefully
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_activity_type text,
  p_points integer,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_challenge_day integer DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert points with conflict handling for duplicate prevention
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
    p_points,
    p_description,
    p_metadata,
    p_challenge_day,
    now()
  )
  ON CONFLICT ON CONSTRAINT unique_milestone_bonus DO NOTHING;

  -- Update leaderboard stats
  PERFORM public.update_leaderboard_stats();

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in award_points: %', SQLERRM;
    RETURN false;
END;
$function$;

-- Fix check_and_award_badges to handle duplicate badge awards
CREATE OR REPLACE FUNCTION public.check_and_award_badges(
  p_user_id uuid,
  p_event_type text,
  p_event_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  badge_record RECORD;
  awarded_badges jsonb := '[]'::jsonb;
  badge_result jsonb;
BEGIN
  -- Loop through active badge definitions
  FOR badge_record IN 
    SELECT * FROM public.badges_definition 
    WHERE is_active = true
  LOOP
    -- Check if badge criteria is met and not already awarded
    IF NOT EXISTS (
      SELECT 1 FROM public.user_badges 
      WHERE user_id = p_user_id AND badge_id = badge_record.id
    ) THEN
      -- Simplified criteria check based on event type
      IF (badge_record.criteria->>'event_type' = p_event_type) THEN
        -- Award badge with conflict handling
        INSERT INTO public.user_badges (user_id, badge_id, earned_at)
        VALUES (p_user_id, badge_record.id, now())
        ON CONFLICT (user_id, badge_id) DO NOTHING;
        
        -- Award points for badge with conflict handling
        INSERT INTO public.user_points_ledger (
          user_id,
          activity_type,
          points_earned,
          description,
          metadata,
          created_at
        ) VALUES (
          p_user_id,
          'badge_earned',
          COALESCE(badge_record.points_reward, 0),
          'Badge earned: ' || badge_record.name,
          jsonb_build_object('badge_id', badge_record.id, 'badge_name', badge_record.name),
          now()
        )
        ON CONFLICT ON CONSTRAINT unique_milestone_bonus DO NOTHING;
        
        -- Add to result
        badge_result := jsonb_build_object(
          'badge_id', badge_record.id,
          'badge_name', badge_record.name,
          'points_reward', COALESCE(badge_record.points_reward, 0)
        );
        awarded_badges := awarded_badges || jsonb_build_array(badge_result);
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'badges_awarded', awarded_badges
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in check_and_award_badges: %', SQLERRM;
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Fix process_variable_reward to handle duplicate reward insertions
CREATE OR REPLACE FUNCTION public.process_variable_reward(
  p_user_id uuid,
  p_event_type text,
  p_context_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  reward_chance numeric;
  random_value numeric;
  reward_points integer;
  reward_result jsonb;
BEGIN
  -- Simple variable reward logic: 20% chance of 50-150 bonus points
  random_value := random();
  
  IF random_value < 0.20 THEN
    reward_points := 50 + floor(random() * 100)::integer;
    
    -- Award bonus points with conflict handling
    INSERT INTO public.user_points_ledger (
      user_id,
      activity_type,
      points_earned,
      description,
      metadata,
      created_at
    ) VALUES (
      p_user_id,
      'variable_reward',
      reward_points,
      'Variable reward bonus!',
      jsonb_build_object(
        'event_type', p_event_type,
        'reward_points', reward_points,
        'timestamp', now()
      ),
      now()
    )
    ON CONFLICT ON CONSTRAINT unique_milestone_bonus DO NOTHING;
    
    reward_result := jsonb_build_object(
      'rewarded', true,
      'points', reward_points,
      'message', 'Bonus reward: ' || reward_points || ' points!'
    );
  ELSE
    reward_result := jsonb_build_object('rewarded', false);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reward', reward_result
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in process_variable_reward: %', SQLERRM;
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;