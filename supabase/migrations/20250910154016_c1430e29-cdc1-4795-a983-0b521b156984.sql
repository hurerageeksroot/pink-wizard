-- Fix update_daily_challenge_progress RPC function to handle DELETE operations properly
CREATE OR REPLACE FUNCTION public.update_daily_challenge_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  challenge_record RECORD;
  current_day INTEGER;
  participant_record RECORD;
BEGIN
  -- Get active challenge configuration
  SELECT * INTO challenge_record
  FROM public.challenge_config
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF challenge_record.id IS NULL THEN
    RAISE NOTICE 'No active challenge found';
    RETURN;
  END IF;
  
  -- Calculate current day
  current_day := CASE 
    WHEN CURRENT_DATE BETWEEN challenge_record.start_date AND challenge_record.end_date 
    THEN (CURRENT_DATE - challenge_record.start_date + 1)::INTEGER
    ELSE GREATEST(1, (challenge_record.end_date - challenge_record.start_date + 1)::INTEGER)
  END;
  
  -- Update challenge config current_day if needed
  UPDATE public.challenge_config 
  SET current_day = GREATEST(current_day, challenge_record.current_day)
  WHERE id = challenge_record.id;
  
  -- Process each active participant
  FOR participant_record IN 
    SELECT user_id 
    FROM public.user_challenge_progress 
    WHERE is_active = true
  LOOP
    -- Update individual participant progress
    UPDATE public.user_challenge_progress
    SET 
      total_days_completed = (
        SELECT COUNT(DISTINCT challenge_day)
        FROM public.user_daily_tasks udt
        JOIN public.daily_tasks_definition dtd ON dtd.id = udt.task_id
        WHERE udt.user_id = participant_record.user_id
          AND udt.completed = true
          AND dtd.is_active = true
          AND udt.challenge_day <= current_day
      ),
      overall_progress = LEAST(100.0, 
        (SELECT COUNT(DISTINCT challenge_day)::numeric
         FROM public.user_daily_tasks udt
         JOIN public.daily_tasks_definition dtd ON dtd.id = udt.task_id
         WHERE udt.user_id = participant_record.user_id
           AND udt.completed = true
           AND dtd.is_active = true
           AND udt.challenge_day <= current_day
        ) / GREATEST(1, current_day::numeric) * 100
      ),
      current_streak = (
        WITH daily_completions AS (
          SELECT challenge_day,
                 COUNT(*) as completed_tasks,
                 (SELECT COUNT(*) FROM public.daily_tasks_definition WHERE is_active = true) as total_tasks
          FROM public.user_daily_tasks udt
          JOIN public.daily_tasks_definition dtd ON dtd.id = udt.task_id
          WHERE udt.user_id = participant_record.user_id
            AND udt.completed = true
            AND dtd.is_active = true
            AND udt.challenge_day <= current_day
          GROUP BY challenge_day
        ),
        complete_days AS (
          SELECT challenge_day
          FROM daily_completions
          WHERE completed_tasks = total_tasks
          ORDER BY challenge_day DESC
        )
        SELECT COALESCE(
          (SELECT COUNT(*)
           FROM complete_days cd1
           WHERE NOT EXISTS (
             SELECT 1 FROM complete_days cd2
             WHERE cd2.challenge_day = cd1.challenge_day + 1
           )
           AND cd1.challenge_day = (SELECT MAX(challenge_day) FROM complete_days)
          ), 0
        )
      ),
      updated_at = now()
    WHERE user_id = participant_record.user_id
      AND is_active = true;
  END LOOP;
  
  -- Update leaderboard stats after progress updates
  PERFORM public.update_leaderboard_stats();
  
  RAISE NOTICE 'Daily challenge progress updated successfully for challenge day %', current_day;
END;
$function$