-- Add configuration settings for the database functions
-- This ensures the functions can access necessary environment variables

-- Enable the pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add configuration settings
ALTER DATABASE postgres SET "app.supabase_url" TO 'https://idwkrddbdyakmpshsvtd.supabase.co';
ALTER DATABASE postgres SET "app.supabase_service_key" TO 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkd2tyZGRiZHlha21wc2hzdnRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY0ODY4MSwiZXhwIjoyMDcxMjI0NjgxfQ.UHdcc6vWsI_FdO_o-DuJOLDB_DLGW1r9W8IFoyy2v7k';

-- Create a cron job to process email sequences every 15 minutes
SELECT cron.schedule(
  'process-email-sequences',
  '*/15 * * * *', -- every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://idwkrddbdyakmpshsvtd.supabase.co/functions/v1/process-email-sequences',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkd2tyZGRiZHlha21wc2hzdnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDg2ODEsImV4cCI6MjA3MTIyNDY4MX0.q_VRJrfAeha5q-qPC2ivJaFqX8yJyxjmRKFXnIuBObA"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);