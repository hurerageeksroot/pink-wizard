-- Step 1: Clean up orphaned user_metrics (metrics pointing to deleted activities)
DELETE FROM public.user_metrics
WHERE metric_name = 'event_value'
  AND activity_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.activities 
    WHERE activities.id = user_metrics.activity_id
  );

-- Step 2: Add foreign key constraint with CASCADE delete to prevent future orphans
ALTER TABLE public.user_metrics
DROP CONSTRAINT IF EXISTS user_metrics_activity_id_fkey;

ALTER TABLE public.user_metrics
ADD CONSTRAINT user_metrics_activity_id_fkey 
FOREIGN KEY (activity_id) 
REFERENCES public.activities(id) 
ON DELETE CASCADE;

-- The recalculate_contact_revenue() trigger will automatically 
-- update contacts.revenue_amount after the deletions complete