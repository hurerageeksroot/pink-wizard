-- Comprehensive Data Fix: Award missing points for all completed tasks
-- This migration identifies and fixes all historical data mismatches where tasks were completed
-- but points were not awarded due to bugs in the toggle_user_daily_task function

DO $$
DECLARE
  missing_points_count INTEGER;
  affected_users_count INTEGER;
BEGIN
  -- Insert missing 10-point entries for all completed tasks that lack corresponding points
  INSERT INTO public.user_points_ledger (
    user_id,
    activity_type,
    points_earned,
    description,
    metadata,
    challenge_day,
    created_at
  )
  SELECT 
    udt.user_id,
    'daily_task_completed'::text,
    10,
    'Completed daily task: ' || dtd.name,
    jsonb_build_object(
      'task_id', udt.task_id,
      'task_name', dtd.name,
      'challenge_day', udt.challenge_day,
      'retroactive_fix', true,
      'fix_timestamp', now()
    ),
    udt.challenge_day,
    COALESCE(udt.completed_at, udt.updated_at) -- Use completed_at timestamp, fallback to updated_at
  FROM public.user_daily_tasks udt
  JOIN public.daily_tasks_definition dtd ON dtd.id = udt.task_id
  WHERE udt.completed = true
    AND udt.completed_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 
      FROM public.user_points_ledger upl
      WHERE upl.user_id = udt.user_id
        AND upl.challenge_day = udt.challenge_day
        AND upl.activity_type = 'daily_task_completed'
        AND upl.metadata->>'task_id' = udt.task_id::text
    );
  
  GET DIAGNOSTICS missing_points_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Inserted % missing point entries', missing_points_count;
  
  -- Count affected users
  SELECT COUNT(DISTINCT user_id) INTO affected_users_count
  FROM public.user_points_ledger
  WHERE metadata->>'retroactive_fix' = 'true';
  
  RAISE NOTICE '✅ Fixed data for % users', affected_users_count;
  
  -- Recalculate all user challenge progress and leaderboard stats
  PERFORM public.update_daily_challenge_progress();
  
  RAISE NOTICE '✅ Successfully recalculated challenge progress and leaderboard stats';
  RAISE NOTICE '🎉 Data fix complete! All historical mismatches resolved.';
  
END $$;