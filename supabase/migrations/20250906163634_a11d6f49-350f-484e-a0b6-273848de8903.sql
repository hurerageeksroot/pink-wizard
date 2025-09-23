-- Clean up duplicate milestone bonuses, keeping only the earliest one for each milestone level
WITH ranked_bonuses AS (
  SELECT id, 
         metadata->>'milestone_level' as milestone_level,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, metadata->>'milestone_level' 
           ORDER BY created_at ASC
         ) as rn
  FROM user_points_ledger 
  WHERE activity_type = 'milestone_bonus'
    AND metadata->>'milestone_level' IS NOT NULL
)
DELETE FROM user_points_ledger 
WHERE id IN (
  SELECT id FROM ranked_bonuses WHERE rn > 1
);