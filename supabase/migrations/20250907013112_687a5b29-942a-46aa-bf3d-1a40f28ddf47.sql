-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to run process-email-sequences every 15 minutes
SELECT cron.schedule(
  'process-email-sequences-cron',
  '*/15 * * * *', -- every 15 minutes
  $$
  select
    net.http_post(
        url:='https://idwkrddbdyakmpshsvtd.supabase.co/functions/v1/process-email-sequences',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkd2tyZGRiZHlha21wc2hzdnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDg2ODEsImV4cCI6MjA3MTIyNDY4MX0.q_VRJrfAeha5q-qPC2ivJaFqX8yJyxjmRKFXnIuBObA"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Also manually trigger it once now
select
  net.http_post(
      url:='https://idwkrddbdyakmpshsvtd.supabase.co/functions/v1/process-email-sequences',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkd2tyZGRiZHlha21wc2hzdnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDg2ODEsImV4cCI6MjA3MTIyNDY4MX0.q_VRJrfAeha5q-qPC2ivJaFqX8yJyxjmRKFXnIuBObA"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;