-- Add Sarah as challenge participant
INSERT INTO public.user_challenge_progress (user_id, is_active, joined_at, current_streak, longest_streak, total_days_completed, overall_progress)
SELECT p.id, true, now(), 0, 0, 0, 0.00
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'sarah@sarahandmurphy.com'
ON CONFLICT (user_id) DO UPDATE SET 
  is_active = true, 
  updated_at = now();

-- Check for any remaining problematic triggers or functions
SELECT 
  t.tgname as trigger_name,
  c.relname as table_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname IN ('user_daily_tasks', 'user_challenge_progress') 
  AND t.tgisinternal = false;