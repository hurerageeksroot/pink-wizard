-- Data reconciliation: Create missing user_metrics for revenue activities
-- This fixes the leaderboard data mismatch where activities exist but user_metrics are missing

INSERT INTO public.user_metrics (
  user_id,
  metric_name,
  metric_type,
  value,
  unit,
  challenge_day,
  contact_id,
  activity_id,
  notes,
  created_at
)
SELECT 
  a.user_id,
  'event_value' as metric_name,
  'direct_revenue' as metric_type,
  -- Extract numeric value from "Revenue Logged: $X,XXX.XX" format
  CAST(
    REGEXP_REPLACE(
      SPLIT_PART(a.title, '$', 2), 
      '[^0-9.]', 
      '', 
      'g'
    ) AS NUMERIC
  ) as value,
  'USD' as unit,
  COALESCE(
    (SELECT current_day FROM public.challenge_config WHERE is_active = true LIMIT 1),
    1
  ) as challenge_day,
  a.contact_id,
  a.id as activity_id,
  a.description as notes,
  a.created_at
FROM public.activities a
LEFT JOIN public.user_metrics um 
  ON um.activity_id = a.id 
  AND um.metric_name = 'event_value'
WHERE a.type = 'revenue'
  AND um.id IS NULL  -- Only insert where metric is missing
  AND a.title LIKE 'Revenue Logged:%'  -- Only process properly formatted activities
ON CONFLICT DO NOTHING;

-- The recalculate_contact_revenue() trigger will automatically update contacts.revenue_amount
-- after these inserts complete