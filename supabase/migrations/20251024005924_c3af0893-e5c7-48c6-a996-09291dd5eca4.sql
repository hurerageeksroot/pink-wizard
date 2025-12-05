-- Fix streak calculation algorithm using LAG and cumulative breaks
CREATE OR REPLACE FUNCTION public.update_daily_challenge_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  participant_record RECORD;
  calculated_current_day integer;
  user_timezone text;
BEGIN
  -- Loop through all active challenge participants
  FOR participant_record IN 
    SELECT user_id, timezone 
    FROM public.user_challenge_progress ucp
    JOIN public.profiles p ON p.id = ucp.user_id
    WHERE ucp.is_active = true
  LOOP
    -- Get user's timezone (default to America/New_York if not set)
    user_timezone := COALESCE(participant_record.timezone, 'America/New_York');
    
    -- Calculate current challenge day for this user using their timezone
    SELECT public.get_user_challenge_day(participant_record.user_id, user_timezone)
    INTO calculated_current_day;
    
    -- Skip if no valid challenge day
    IF calculated_current_day IS NULL OR calculated_current_day < 1 THEN
      CONTINUE;
    END IF;
    
    -- Update user's challenge progress with correct streak calculation
    UPDATE public.user_challenge_progress
    SET 
      -- Current streak: count consecutive days from most recent completion
      current_streak = (
        WITH daily_completions AS (
          -- Identify which days were fully completed
          SELECT challenge_day,
                 COUNT(*) as completed_tasks,
                 (SELECT COUNT(*) FROM public.daily_tasks_definition WHERE is_active = true) as total_tasks
          FROM public.user_daily_tasks udt
          JOIN public.daily_tasks_definition dtd ON dtd.id = udt.task_id
          WHERE udt.user_id = participant_record.user_id
            AND udt.completed = true
            AND dtd.is_active = true
            AND udt.challenge_day <= calculated_current_day
          GROUP BY challenge_day
        ),
        complete_days AS (
          -- Filter to only days where ALL tasks were completed
          SELECT challenge_day
          FROM daily_completions
          WHERE completed_tasks >= total_tasks
          ORDER BY challenge_day DESC
        ),
        streak_calc AS (
          -- Use LAG to detect gaps in consecutive days
          SELECT 
            challenge_day,
            LAG(challenge_day) OVER (ORDER BY challenge_day DESC) as prev_day,
            CASE 
              WHEN LAG(challenge_day) OVER (ORDER BY challenge_day DESC) IS NULL THEN 0
              WHEN LAG(challenge_day) OVER (ORDER BY challenge_day DESC) = challenge_day + 1 THEN 0
              ELSE 1
            END as is_break
          FROM complete_days
        ),
        streak_with_groups AS (
          -- Cumulative sum of breaks creates streak groups
          SELECT 
            challenge_day,
            SUM(is_break) OVER (ORDER BY challenge_day DESC) as break_count
          FROM streak_calc
        )
        -- Count all consecutive days from most recent (break_count = 0)
        SELECT COUNT(*)
        FROM streak_with_groups
        WHERE break_count = 0
      ),
      
      -- Longest streak: find the longest consecutive sequence ever
      longest_streak = GREATEST(
        longest_streak,
        (
          WITH daily_completions AS (
            SELECT challenge_day,
                   COUNT(*) as completed_tasks,
                   (SELECT COUNT(*) FROM public.daily_tasks_definition WHERE is_active = true) as total_tasks
            FROM public.user_daily_tasks udt
            JOIN public.daily_tasks_definition dtd ON dtd.id = udt.task_id
            WHERE udt.user_id = participant_record.user_id
              AND udt.completed = true
              AND dtd.is_active = true
              AND udt.challenge_day <= calculated_current_day
            GROUP BY challenge_day
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
              LAG(challenge_day) OVER (ORDER BY challenge_day DESC) as prev_day,
              CASE 
                WHEN LAG(challenge_day) OVER (ORDER BY challenge_day DESC) IS NULL THEN 0
                WHEN LAG(challenge_day) OVER (ORDER BY challenge_day DESC) = challenge_day + 1 THEN 0
                ELSE 1
              END as is_break
            FROM complete_days
          ),
          streak_with_groups AS (
            SELECT 
              challenge_day,
              SUM(is_break) OVER (ORDER BY challenge_day DESC) as break_count
            FROM streak_calc
          )
          -- Find the longest streak group
          SELECT COALESCE(MAX(streak_length), 0)
          FROM (
            SELECT break_count, COUNT(*) as streak_length
            FROM streak_with_groups
            GROUP BY break_count
          ) streak_lengths
        )
      ),
      
      -- Total days completed (any day with all tasks done)
      total_days_completed = (
        WITH daily_completions AS (
          SELECT challenge_day,
                 COUNT(*) as completed_tasks,
                 (SELECT COUNT(*) FROM public.daily_tasks_definition WHERE is_active = true) as total_tasks
          FROM public.user_daily_tasks udt
          JOIN public.daily_tasks_definition dtd ON dtd.id = udt.task_id
          WHERE udt.user_id = participant_record.user_id
            AND udt.completed = true
            AND dtd.is_active = true
            AND udt.challenge_day <= calculated_current_day
          GROUP BY challenge_day
        )
        SELECT COUNT(*)
        FROM daily_completions
        WHERE completed_tasks >= total_tasks
      ),
      
      -- Overall progress percentage
      overall_progress = (
        WITH daily_completions AS (
          SELECT challenge_day,
                 COUNT(*) as completed_tasks,
                 (SELECT COUNT(*) FROM public.daily_tasks_definition WHERE is_active = true) as total_tasks
          FROM public.user_daily_tasks udt
          JOIN public.daily_tasks_definition dtd ON dtd.id = udt.task_id
          WHERE udt.user_id = participant_record.user_id
            AND udt.completed = true
            AND dtd.is_active = true
            AND udt.challenge_day <= calculated_current_day
          GROUP BY challenge_day
        ),
        complete_day_count AS (
          SELECT COUNT(*) as completed_days
          FROM daily_completions
          WHERE completed_tasks >= total_tasks
        )
        SELECT CASE 
          WHEN calculated_current_day = 0 THEN 0
          ELSE ROUND((completed_days::numeric / calculated_current_day::numeric) * 100, 2)
        END
        FROM complete_day_count
      ),
      
      updated_at = now()
    WHERE user_id = participant_record.user_id;
    
  END LOOP;
END;
$function$;