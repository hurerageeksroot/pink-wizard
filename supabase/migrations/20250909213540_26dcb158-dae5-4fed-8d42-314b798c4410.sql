-- Retroactively award points for all completed daily tasks during challenge period
-- that didn't receive points due to the bug

WITH challenge_period AS (
  SELECT '2025-09-08'::date as start_date, '2025-11-22'::date as end_date
),
missing_task_points AS (
  SELECT 
    udt.user_id,
    udt.task_id,
    udt.challenge_day,
    udt.completed_at,
    dtd.name as task_name,
    udt.id as user_task_id
  FROM public.user_daily_tasks udt
  JOIN public.daily_tasks_definition dtd ON udt.task_id = dtd.id
  CROSS JOIN challenge_period cp
  WHERE udt.completed = true 
    AND udt.completed_at::date >= cp.start_date
    AND udt.completed_at::date <= cp.end_date
    -- Only tasks that don't already have corresponding points
    AND NOT EXISTS (
      SELECT 1 FROM public.user_points_ledger upl 
      WHERE upl.user_id = udt.user_id 
        AND upl.activity_type = 'daily_task_completed'
        AND upl.metadata->>'task_id' = udt.task_id::text
        AND upl.challenge_day = udt.challenge_day
    )
)
INSERT INTO public.user_points_ledger (
  user_id, 
  activity_type, 
  points_earned, 
  description, 
  challenge_day, 
  metadata,
  created_at
)
SELECT 
  mtp.user_id,
  'daily_task_completed'::text,
  10, -- Standard points per daily task
  'Retroactive points for completed daily task: ' || mtp.task_name,
  mtp.challenge_day,
  jsonb_build_object(
    'task_id', mtp.task_id,
    'task_name', mtp.task_name,
    'challenge_day', mtp.challenge_day,
    'retroactive', true,
    'original_completion_date', mtp.completed_at
  ),
  mtp.completed_at -- Use original completion timestamp
FROM missing_task_points mtp;