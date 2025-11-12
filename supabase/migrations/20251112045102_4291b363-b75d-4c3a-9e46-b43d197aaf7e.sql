-- ============================================
-- FASE 1.1: CRON JOB PARA CHECK DE ASSINATURAS
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para executar diariamente às 9h BRT (12h UTC)
SELECT cron.schedule(
  'check-subscriptions-daily',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/check-expired-subscriptions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmc2VlZXh3YWZ6bWV6dWZ3ZHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTk2OTIsImV4cCI6MjA3NTQzNTY5Mn0.JGLZs1_NyLyurkJWLd6DnwYEXMQ7ZZ6qWpl9uB9Pz_4'
    ),
    body := jsonb_build_object('time', NOW()::text)
  ) as request_id;
  $$
);

-- ============================================
-- FASE 1.2: TRIGGER PARA STATUS OVERDUE
-- ============================================

-- Função que atualiza invoices vencidas
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE invoices 
  SET status = 'overdue' 
  WHERE due_date < NOW() 
    AND status = 'pending';
  
  RAISE NOTICE 'Updated % invoices to overdue', (SELECT COUNT(*) FROM invoices WHERE status = 'overdue');
END;
$$;

-- Trigger executado antes de INSERT/UPDATE em invoices
CREATE OR REPLACE FUNCTION trigger_check_overdue()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se inseriu/atualizou com due_date passada e status pending, muda para overdue
  IF NEW.due_date < NOW() AND NEW.status = 'pending' THEN
    NEW.status := 'overdue';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_overdue_on_insert_update ON invoices;
CREATE TRIGGER check_overdue_on_insert_update
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION trigger_check_overdue();

-- Cron adicional para verificar diariamente (caso trigger falhe)
SELECT cron.schedule(
  'check-overdue-invoices-daily',
  '30 12 * * *',
  'SELECT update_overdue_invoices();'
);

-- ============================================
-- FASE 3.1: TABELA CHECKOUT_SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL,
  external_id TEXT,
  url TEXT,
  qr_code TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_invoice_id ON checkout_sessions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_external_id ON checkout_sessions(external_id);

-- RLS
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view all sessions" ON checkout_sessions;
CREATE POLICY "Super admins can view all sessions"
  ON checkout_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Tenant admins can view their sessions" ON checkout_sessions;
CREATE POLICY "Tenant admins can view their sessions"
  ON checkout_sessions FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE tenant_id IN (
        SELECT tenant_id FROM user_roles 
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "System can insert sessions" ON checkout_sessions;
CREATE POLICY "System can insert sessions"
  ON checkout_sessions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update sessions" ON checkout_sessions;
CREATE POLICY "System can update sessions"
  ON checkout_sessions FOR UPDATE
  USING (true);