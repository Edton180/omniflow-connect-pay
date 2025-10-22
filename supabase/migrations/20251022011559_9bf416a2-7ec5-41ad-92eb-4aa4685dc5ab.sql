-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para verificar assinaturas expiradas diariamente às 00:00
SELECT cron.schedule(
  'check-expired-subscriptions-daily',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/check-expired-subscriptions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmc2VlZXh3YWZ6bWV6dWZ3ZHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTk2OTIsImV4cCI6MjA3NTQzNTY5Mn0.JGLZs1_NyLyurkJWLd6DnwYEXMQ7ZZ6qWpl9uB9Pz_4"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);