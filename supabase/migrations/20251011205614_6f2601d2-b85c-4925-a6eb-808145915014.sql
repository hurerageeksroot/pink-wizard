-- Disable the recursive trigger that causes transaction rollbacks
DROP TRIGGER IF EXISTS trigger_performance_bonus_check ON public.user_points_ledger;

-- Drop the function that was called by the trigger
DROP FUNCTION IF EXISTS public.trigger_bonus_check();

-- Optional: Add scheduled job to check bonuses hourly instead of on every insert
-- This prevents recursion while still checking for bonuses regularly
SELECT cron.schedule(
  'check-performance-bonuses-hourly',
  '0 * * * *', -- Every hour
  $$
  SELECT public.check_weekly_bonuses_for_all_users();
  $$
);