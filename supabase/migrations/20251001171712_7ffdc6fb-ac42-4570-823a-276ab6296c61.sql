-- Retroactively award missing points for email activities during glitch period
-- User: 46604fe5-a7c9-4df0-bb36-c6ffdf65ae08 (Renee)
-- Activity #1: 5e41e8fd-98d4-4567-a38d-cc512db5ac79 - "Sent first outreach email" 
-- Activity #2: 375999f0-7b81-406b-a292-374bbc4ffde9 - "First outreach email sent"

INSERT INTO public.user_points_ledger (
  user_id,
  activity_type,
  points_earned,
  description,
  metadata,
  challenge_day,
  created_at
)
VALUES 
  (
    '46604fe5-a7c9-4df0-bb36-c6ffdf65ae08'::uuid,
    'email',
    15,
    'Retroactive: Sent first outreach email',
    jsonb_build_object(
      'activity_id', '5e41e8fd-98d4-4567-a38d-cc512db5ac79',
      'retroactive', true,
      'reason', 'points_values_table_missing'
    ),
    1,
    '2025-01-31 19:42:38.815+00'::timestamptz
  ),
  (
    '46604fe5-a7c9-4df0-bb36-c6ffdf65ae08'::uuid,
    'email',
    15,
    'Retroactive: First outreach email sent',
    jsonb_build_object(
      'activity_id', '375999f0-7b81-406b-a292-374bbc4ffde9',
      'retroactive', true,
      'reason', 'points_values_table_missing'
    ),
    1,
    '2025-01-31 19:43:13.342+00'::timestamptz
  );

-- Update leaderboard stats to reflect the new points
SELECT public.update_leaderboard_stats();