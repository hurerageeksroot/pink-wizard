-- Fix streak calculation in update_daily_challenge_progress function
CREATE OR REPLACE FUNCTION public.update_daily_challenge_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  participant_record RECORD;
  challenge_record RECORD;
  calculated_current_day INTEGER;
  calculated_current_week INTEGER;
  user_tz TEXT;
BEGIN
  -- Get active challenge
  SELECT * INTO challenge_record
  FROM public.challenge_config
  WHERE is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE NOTICE 'No active challenge found';
    RETURN;
  END IF;

  -- Loop through all challenge participants
  FOR participant_record IN 
    SELECT ucp.*, p.timezone
    FROM public.user_challenge_progress ucp
    LEFT JOIN public.profiles p ON p.id = ucp.user_id
    WHERE ucp.is_participant = true
  LOOP
    -- Get user timezone, default to UTC
    user_tz := COALESCE(participant_record.timezone, 'UTC');
    
    -- Calculate current day in user's timezone
    calculated_current_day := GREATEST(1, 
      EXTRACT(DAY FROM (
        (CURRENT_TIMESTAMP AT TIME ZONE user_tz)::date - 
        challenge_record.start_date::date
      ))::INTEGER + 1
    );

    -- Calculate current week (1-indexed)
    calculated_current_week := LEAST(
      CEIL(calculated_current_day::NUMERIC / 7)::INTEGER,
      challenge_record.total_weeks
    );

    -- Update user challenge progress
    UPDATE public.user_challenge_progress
    SET 
      current_day = calculated_current_day,
      current_week = calculated_current_week,
      last_updated = NOW(),
      -- Calculate current streak using fixed algorithm
      current_streak = (
        WITH daily_completions AS (
          -- Identify which days were fully completed
          SELECT 
            udt.challenge_day,
            COUNT(*) as completed_tasks,
            (SELECT COUNT(*) FROM public.daily_tasks_definition WHERE is_active = true) as total_tasks
          FROM public.user_daily_tasks udt
          JOIN public.daily_tasks_definition dtd ON dtd.id = udt.task_id
          WHERE udt.user_id = participant_record.user_id
            AND udt.completed = true
            AND dtd.is_active = true
            AND udt.challenge_day <= calculated_current_day
          GROUP BY udt.challenge_day
        ),
        complete_days AS (
          -- Filter to only days where ALL tasks were completed
          SELECT challenge_day
          FROM daily_completions
          WHERE completed_tasks >= total_tasks
          ORDER BY challenge_day DESC
        ),
        streak_calc AS (
          -- Assign a group number that stays constant for consecutive days
          -- When there's a gap, the group number changes
          SELECT 
            challenge_day,
            challenge_day - ROW_NUMBER() OVER (ORDER BY challenge_day DESC) as streak_group
          FROM complete_days
        )
        -- Count the size of the streak group containing the most recent day
        SELECT COALESCE(COUNT(*), 0)
        FROM streak_calc
        WHERE streak_group = (
          SELECT streak_group 
          FROM streak_calc 
          ORDER BY challenge_day DESC 
          LIMIT 1
        )
      ),
      -- Update longest streak if current streak exceeds it
      longest_streak = GREATEST(
        COALESCE(longest_streak, 0),
        (
          WITH daily_completions AS (
            SELECT 
              udt.challenge_day,
              COUNT(*) as completed_tasks,
              (SELECT COUNT(*) FROM public.daily_tasks_definition WHERE is_active = true) as total_tasks
            FROM public.user_daily_tasks udt
            JOIN public.daily_tasks_definition dtd ON dtd.id = udt.task_id
            WHERE udt.user_id = participant_record.user_id
              AND udt.completed = true
              AND dtd.is_active = true
              AND udt.challenge_day <= calculated_current_day
            GROUP BY udt.challenge_day
          ),
          complete_days AS (
            SELECT challenge_day
            FROM daily_completions
            WHERE completed_tasks >= total_tasks
            ORDER BY challenge_day DESC
          ),
          streak_calc AS (
            SELECT 
              challenge_day,
              challenge_day - ROW_NUMBER() OVER (ORDER BY challenge_day DESC) as streak_group
            FROM complete_days
          )
          SELECT COALESCE(COUNT(*), 0)
          FROM streak_calc
          WHERE streak_group = (
            SELECT streak_group 
            FROM streak_calc 
            ORDER BY challenge_day DESC 
            LIMIT 1
          )
        )
      )
    WHERE user_id = participant_record.user_id;

  END LOOP;

  RAISE NOTICE 'Successfully updated challenge progress for all participants';
END;
$function$;