-- Melhorias no sistema de pagamentos

-- 1. Adicionar tabela de webhook_logs para rastreabilidade e retry
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_id TEXT,
  payload JSONB NOT NULL,
  signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, success, failed
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index para buscar eventos não processados
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_gateway_event ON public.webhook_logs(gateway, event_id);

-- 2. Melhorar tabela de checkout_sessions com mais detalhes
ALTER TABLE public.checkout_sessions 
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- 3. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON public.checkout_sessions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_external_id ON public.checkout_sessions(external_id);

-- 4. Melhorar tabela de payments com mais informações
ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- 5. Criar índices otimizados para queries comuns
CREATE INDEX IF NOT EXISTS idx_payments_tenant_status ON public.payments(tenant_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_id ON public.payments(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON public.invoices(tenant_id, status, due_date);

-- 6. Função para processar pagamento de invoice
CREATE OR REPLACE FUNCTION public.process_invoice_payment(invoice_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice RECORD;
  v_tenant RECORD;
  result JSON;
BEGIN
  -- Buscar invoice
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = invoice_id_param;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invoice not found');
  END IF;

  -- Verificar se já foi paga
  IF v_invoice.status = 'paid' THEN
    RETURN json_build_object('success', true, 'message', 'Invoice already paid');
  END IF;

  -- Atualizar invoice como paga
  UPDATE public.invoices
  SET 
    status = 'paid',
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = invoice_id_param;

  -- Buscar tenant
  SELECT * INTO v_tenant
  FROM public.tenants
  WHERE id = v_invoice.tenant_id;

  -- Se tenant estava com subscription vencida, reativar
  IF v_tenant.subscription_status IN ('expired', 'past_due') THEN
    UPDATE public.tenants
    SET 
      subscription_status = 'active',
      is_active = true,
      expiry_date = CASE 
        WHEN expiry_date IS NULL OR expiry_date < NOW() 
        THEN NOW() + INTERVAL '30 days'
        ELSE expiry_date + INTERVAL '30 days'
      END,
      updated_at = NOW()
    WHERE id = v_invoice.tenant_id;
  END IF;

  -- Se há subscription_id, atualizar subscription
  IF v_invoice.subscription_id IS NOT NULL THEN
    UPDATE public.subscriptions
    SET 
      status = 'active',
      expires_at = CASE 
        WHEN expires_at IS NULL OR expires_at < NOW() 
        THEN NOW() + INTERVAL '30 days'
        ELSE expires_at + INTERVAL '30 days'
      END,
      updated_at = NOW()
    WHERE id = v_invoice.subscription_id;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'invoice_id', invoice_id_param,
    'tenant_id', v_invoice.tenant_id,
    'amount', v_invoice.amount
  );
END;
$$;

-- 7. Função para verificar e processar webhooks duplicados (idempotência)
CREATE OR REPLACE FUNCTION public.ensure_webhook_idempotency(
  p_gateway TEXT,
  p_event_id TEXT,
  p_payload JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing_log RECORD;
BEGIN
  -- Verificar se evento já foi processado
  SELECT * INTO v_existing_log
  FROM public.webhook_logs
  WHERE gateway = p_gateway 
    AND event_id = p_event_id
    AND status = 'success';

  IF FOUND THEN
    -- Evento já foi processado com sucesso
    RETURN FALSE;
  END IF;

  -- Registrar novo evento
  INSERT INTO public.webhook_logs (gateway, event_type, event_id, payload, status)
  VALUES (p_gateway, p_payload->>'type', p_event_id, p_payload, 'processing')
  ON CONFLICT DO NOTHING;

  RETURN TRUE;
END;
$$;

-- 8. Função para marcar webhook como processado
CREATE OR REPLACE FUNCTION public.mark_webhook_processed(
  p_gateway TEXT,
  p_event_id TEXT,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.webhook_logs
  SET 
    status = CASE WHEN p_success THEN 'success' ELSE 'failed' END,
    error_message = p_error_message,
    processed_at = NOW(),
    retry_count = retry_count + 1,
    last_retry_at = NOW()
  WHERE gateway = p_gateway AND event_id = p_event_id;
END;
$$;

-- 9. RLS policies para webhook_logs (apenas super admin)
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view webhook logs"
  ON public.webhook_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- 10. Criar view para estatísticas de pagamentos
CREATE OR REPLACE VIEW public.payment_statistics AS
SELECT 
  tenant_id,
  payment_gateway,
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_payments,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
  SUM(amount) FILTER (WHERE status = 'completed') as total_revenue,
  AVG(amount) FILTER (WHERE status = 'completed') as average_payment,
  DATE_TRUNC('month', created_at) as month
FROM public.payments
GROUP BY tenant_id, payment_gateway, DATE_TRUNC('month', created_at);

-- RLS para view
ALTER VIEW public.payment_statistics SET (security_invoker = true);

COMMENT ON TABLE webhook_logs IS 'Logs de webhooks recebidos dos gateways de pagamento para rastreabilidade e retry';
COMMENT ON FUNCTION process_invoice_payment IS 'Processa pagamento de invoice, reativa tenant e atualiza subscription';
COMMENT ON FUNCTION ensure_webhook_idempotency IS 'Garante que webhooks não sejam processados em duplicidade';
COMMENT ON VIEW payment_statistics IS 'Estatísticas agregadas de pagamentos por tenant e gateway';