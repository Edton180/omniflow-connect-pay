-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the check-expired-subscriptions function to run daily at midnight
SELECT cron.schedule(
  'check-expired-subscriptions-daily',
  '0 0 * * *', -- Daily at midnight
  $$
  SELECT
    net.http_post(
        url:='https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/check-expired-subscriptions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmc2VlZXh3YWZ6bWV6dWZ3ZHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTk2OTIsImV4cCI6MjA3NTQzNTY5Mn0.JGLZs1_NyLyurkJWLd6DnwYEXMQ7ZZ6qWpl9uB9Pz_4"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Create trigger to automatically generate invoices when subscription expires
DROP TRIGGER IF EXISTS trigger_auto_generate_invoice ON subscriptions;

CREATE TRIGGER trigger_auto_generate_invoice
  AFTER UPDATE ON subscriptions
  FOR EACH ROW
  WHEN (NEW.expires_at <= NOW() AND NEW.status = 'active' AND OLD.status = 'active')
  EXECUTE FUNCTION auto_generate_invoice_on_expiry();