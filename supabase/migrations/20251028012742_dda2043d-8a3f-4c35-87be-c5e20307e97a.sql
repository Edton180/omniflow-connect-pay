-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA extensions TO postgres;

-- Schedule the contact online status update to run every 2 minutes
SELECT cron.schedule(
  'update-contacts-online-status',
  '*/2 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/update-contacts-online-status',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmc2VlZXh3YWZ6bWV6dWZ3ZHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTk2OTIsImV4cCI6MjA3NTQzNTY5Mn0.JGLZs1_NyLyurkJWLd6DnwYEXMQ7ZZ6qWpl9uB9Pz_4"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);