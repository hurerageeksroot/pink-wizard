-- Retroactive Points Restoration with Correct Trigger Name
-- Temporarily disable bonus check trigger to prevent duplicate bonus awards

-- Disable the performance bonus check trigger temporarily
ALTER TABLE public.user_points_ledger DISABLE TRIGGER trigger_performance_bonus_check;

-- Insert missing point awards for all completed activities
WITH missing_activities AS (
  SELECT 
    a.id as activity_id,
    a.user_id,
    a.type as activity_type,
    CASE 
      WHEN a.type = 'email' THEN 15
      WHEN a.type = 'call' THEN 20
      WHEN a.type = 'meeting' THEN 25
      WHEN a.type = 'social_media' THEN 10
      ELSE 10
    END as points_earned,
    'Retroactive points for: ' || a.title as description,
    jsonb_build_object(
      'activity_id', a.id,
      'contact_id', a.contact_id,
      'retroactive', true,
      'restoration_date', now()
    ) as metadata,
    COALESCE(
      (SELECT current_day FROM public.challenge_config WHERE is_active = true ORDER BY created_at DESC LIMIT 1),
      1
    ) as challenge_day,
    a.completed_at
  FROM public.activities a
  WHERE a.completed_at IS NOT NULL
    AND a.type IN ('email', 'call', 'meeting', 'social_media')
    AND NOT EXISTS (
      SELECT 1 
      FROM public.user_points_ledger upl
      WHERE upl.user_id = a.user_id
        AND upl.activity_type = a.type
        AND (upl.metadata->>'activity_id')::uuid = a.id
    )
)
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
  user_id,
  activity_type,
  points_earned,
  description,
  metadata,
  challenge_day,
  completed_at
FROM missing_activities
ORDER BY completed_at;

-- Re-enable the performance bonus check trigger
ALTER TABLE public.user_points_ledger ENABLE TRIGGER trigger_performance_bonus_check;

-- Log restoration success
DO $$
DECLARE
  affected_users INTEGER;
  total_points INTEGER;
BEGIN
  SELECT 
    COUNT(DISTINCT user_id),
    COALESCE(SUM(points_earned), 0)
  INTO affected_users, total_points
  FROM public.user_points_ledger
  WHERE metadata->>'retroactive' = 'true';
  
  RAISE NOTICE 'Retroactive restoration complete: % users, % points', affected_users, total_points;
END $$;