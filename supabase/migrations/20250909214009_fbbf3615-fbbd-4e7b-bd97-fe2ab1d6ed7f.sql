-- Award retroactive points for weekly, onboarding, and program task completions
-- that didn't receive points due to the bug

WITH challenge_period AS (
  SELECT '2025-09-08'::date as start_date, '2025-11-22'::date as end_date
),
missing_onboarding_points AS (
  SELECT 
    uot.user_id,
    uot.task_id,
    uot.completed_at,
    otd.name as task_name,
    20 as points_to_award -- Onboarding tasks worth 20 points
  FROM public.user_onboarding_tasks uot
  JOIN public.onboarding_tasks_definition otd ON uot.task_id = otd.id
  CROSS JOIN challenge_period cp
  WHERE uot.completed = true 
    AND uot.completed_at::date >= cp.start_date
    AND uot.completed_at::date <= cp.end_date
    AND NOT EXISTS (
      SELECT 1 FROM public.user_points_ledger upl 
      WHERE upl.user_id = uot.user_id 
        AND upl.activity_type = 'onboarding_task_completed'
        AND upl.metadata->>'task_id' = uot.task_id::text
    )
),
missing_weekly_points AS (
  SELECT 
    uwt.user_id,
    uwt.task_id,
    uwt.completed_at,
    wtd.name as task_name,
    10 as points_to_award -- Weekly tasks worth 10 points
  FROM public.user_weekly_tasks uwt
  JOIN public.weekly_tasks_definition wtd ON uwt.task_id = wtd.id
  CROSS JOIN challenge_period cp
  WHERE uwt.completed = true 
    AND uwt.completed_at::date >= cp.start_date
    AND uwt.completed_at::date <= cp.end_date
    AND NOT EXISTS (
      SELECT 1 FROM public.user_points_ledger upl 
      WHERE upl.user_id = uwt.user_id 
        AND upl.activity_type = 'weekly_task_completed'
        AND upl.metadata->>'task_id' = uwt.task_id::text
    )
),
missing_program_points AS (
  SELECT 
    upt.user_id,
    upt.program_task_definition_id as task_id,
    upt.completed_at,
    ptd.name as task_name,
    10 as points_to_award -- Program tasks worth 10 points
  FROM public.user_program_tasks upt
  JOIN public.program_tasks_definition ptd ON upt.program_task_definition_id = ptd.id
  CROSS JOIN challenge_period cp
  WHERE upt.completed = true 
    AND upt.completed_at::date >= cp.start_date
    AND upt.completed_at::date <= cp.end_date
    AND NOT EXISTS (
      SELECT 1 FROM public.user_points_ledger upl 
      WHERE upl.user_id = upt.user_id 
        AND upl.activity_type = 'program_task_completed'
        AND upl.metadata->>'task_id' = upt.program_task_definition_id::text
    )
),
all_missing_points AS (
  SELECT user_id, task_id, completed_at, task_name, points_to_award, 'onboarding_task_completed' as activity_type FROM missing_onboarding_points
  UNION ALL
  SELECT user_id, task_id, completed_at, task_name, points_to_award, 'weekly_task_completed' as activity_type FROM missing_weekly_points
  UNION ALL
  SELECT user_id, task_id, completed_at, task_name, points_to_award, 'program_task_completed' as activity_type FROM missing_program_points
)
INSERT INTO public.user_points_ledger (
  user_id, 
  activity_type, 
  points_earned, 
  description, 
  metadata,
  created_at
)
SELECT 
  amp.user_id,
  amp.activity_type,
  amp.points_to_award,
  'Retroactive points for completed ' || REPLACE(amp.activity_type, '_', ' ') || ': ' || amp.task_name,
  jsonb_build_object(
    'task_id', amp.task_id,
    'task_name', amp.task_name,
    'retroactive', true,
    'original_completion_date', amp.completed_at
  ),
  amp.completed_at -- Use original completion timestamp
FROM all_missing_points amp;