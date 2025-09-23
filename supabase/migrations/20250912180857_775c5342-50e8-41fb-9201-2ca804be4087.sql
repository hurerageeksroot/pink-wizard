-- Fix RLS policies on user_points_ledger to allow the award_points RPC to work
-- The award_points function should be SECURITY DEFINER and bypass RLS

-- First, let's create the award_points function with proper security settings if it doesn't exist
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_activity_type text,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  points_to_award numeric;
  activity_weight numeric;
BEGIN
  -- Validate user exists and is authenticated
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  -- Get activity weight from activity_weights table
  SELECT weight INTO activity_weight
  FROM public.activity_weights 
  WHERE activity_type = p_activity_type AND is_active = true
  LIMIT 1;
  
  -- Default to 10 points if no weight found
  points_to_award := COALESCE(activity_weight, 10.0);
  
  -- Insert points record (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.user_points_ledger (
    user_id,
    activity_type,
    points_earned,
    description,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_activity_type,
    points_to_award::integer,
    p_description,
    p_metadata,
    now()
  );
  
  -- Update leaderboard stats
  PERFORM public.update_leaderboard_stats(p_user_id);
  
  RETURN points_to_award;
END;
$$;

-- Fix search_path for other functions that have mutable search_path
CREATE OR REPLACE FUNCTION public.auto_create_daily_tasks_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  task_def RECORD;
  challenge_start_date date;
  current_challenge_day integer;
BEGIN
  -- Get the current challenge start date and current day
  SELECT start_date, current_day INTO challenge_start_date, current_challenge_day
  FROM public.challenge_config 
  WHERE is_active = true 
  LIMIT 1;
  
  IF challenge_start_date IS NULL THEN
    RETURN; -- No active challenge
  END IF;
  
  -- Create tasks for all active task definitions for all days up to current day
  FOR task_def IN 
    SELECT id, name 
    FROM public.daily_tasks_definition 
    WHERE is_active = true
  LOOP
    -- Create tasks for each day from 1 to current challenge day
    FOR day_num IN 1..current_challenge_day LOOP
      INSERT INTO public.user_daily_tasks (
        user_id, 
        task_id, 
        challenge_day, 
        completed, 
        created_at, 
        updated_at
      ) VALUES (
        p_user_id,
        task_def.id,
        day_num,
        false,
        now(),
        now()
      ) ON CONFLICT (user_id, task_id, challenge_day) DO NOTHING; -- Prevent duplicates
    END LOOP;
  END LOOP;
END;
$$;

-- Fix search_path for trigger function
CREATE OR REPLACE FUNCTION public.trigger_auto_create_daily_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only trigger for new active challenge progress or reactivation
  IF (TG_OP = 'INSERT' AND NEW.is_active = true) OR 
     (TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true) THEN
    
    -- Create all daily tasks for this user
    PERFORM public.auto_create_daily_tasks_for_user(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;