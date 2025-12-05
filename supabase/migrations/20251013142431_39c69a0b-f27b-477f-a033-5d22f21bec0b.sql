-- Delete orphaned user_metrics with NULL activity_id
-- These are remnants from old edits/deletes before the CASCADE constraint was added
DELETE FROM public.user_metrics
WHERE metric_name = 'event_value'
  AND activity_id IS NULL;