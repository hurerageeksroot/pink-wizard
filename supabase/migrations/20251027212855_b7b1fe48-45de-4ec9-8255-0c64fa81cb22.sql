-- Schedule daily challenge progress update at 2 AM UTC
-- This ensures streaks, completion rates, and leaderboard stats stay fresh
SELECT cron.schedule(
  'daily-challenge-progress-update',
  '0 2 * * *', -- Every day at 2 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://idwkrddbdyakmpshsvtd.supabase.co/functions/v1/update-challenge-progress',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkd2tyZGRiZHlha21wc2hzdnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMjI1NzUsImV4cCI6MjA1MDg5ODU3NX0.qxYOFuBT99p2Gcu4y_j_uIo19lU1CPclRIZGrVUZh4Q"}'::jsonb,
        body:=concat('{"scheduled_run": true, "timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Trigger immediate update to apply fixed streak algorithm to all active participants
SELECT public.update_daily_challenge_progress();