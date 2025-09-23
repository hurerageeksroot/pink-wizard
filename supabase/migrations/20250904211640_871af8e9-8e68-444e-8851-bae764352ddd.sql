-- Remove the user_weekly_goals table since we're replacing it with admin-managed weekly tasks
DROP TABLE IF EXISTS public.user_weekly_goals CASCADE;