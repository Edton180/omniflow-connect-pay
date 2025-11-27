-- ============================================================================
-- CORREÇÕES DE SEGURANÇA - FASE COMPLETA
-- ============================================================================

-- FASE 1: Corrigir funções sem search_path
ALTER FUNCTION public.mark_webhook_processed(text, text, boolean, text) SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.notify_due_invoices() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.update_overdue_invoices() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.notify_overdue_invoices() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.auto_generate_invoice_on_expiry() SET search_path = 'public', 'pg_temp';

-- FASE 2: Adicionar Índices de Performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_user ON public.profiles(tenant_id, id);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id ON public.contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_tenant_column ON public.crm_leads(tenant_id, column_id);
CREATE INDEX IF NOT EXISTS idx_messages_ticket_created ON public.messages(ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_status ON public.payments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_status ON public.subscriptions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_channels_tenant_status ON public.channels(tenant_id, status);

-- FASE 2: Políticas RLS Mais Restritivas - Payments (apenas admins)
DROP POLICY IF EXISTS "Tenant admins can manage their payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view payments in their tenant" ON public.payments;

CREATE POLICY "Only admins can view payments"
  ON public.payments FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin') OR
    (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
  );

CREATE POLICY "Only admins can manage payments"
  ON public.payments FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR
    (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
  );

-- FASE 2: Políticas RLS Mais Restritivas - Invoices (apenas admins)
DROP POLICY IF EXISTS "Tenant admins can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view invoices in their tenant" ON public.invoices;

CREATE POLICY "Only admins can view invoices"
  ON public.invoices FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin') OR
    (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
  );

CREATE POLICY "Only admins can manage invoices"
  ON public.invoices FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR
    (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
  );

-- FASE 5: Sistema de Auditoria - Criar tabela audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES public.tenants(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- RLS para audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Tenant admins can view their tenant audit logs" ON public.audit_logs;

CREATE POLICY "Super admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins can view their tenant audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    has_role(auth.uid(), 'tenant_admin') AND 
    has_tenant_access(auth.uid(), tenant_id)
  );

-- Função para registrar auditoria
CREATE OR REPLACE FUNCTION public.log_audit(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  v_log_id UUID;
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  INSERT INTO public.audit_logs (
    user_id,
    tenant_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    v_tenant_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_data,
    p_new_data
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Triggers para auditoria
CREATE OR REPLACE FUNCTION public.audit_user_roles_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit('INSERT', 'user_roles', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit('UPDATE', 'user_roles', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit('DELETE', 'user_roles', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_user_roles ON public.user_roles;
CREATE TRIGGER trigger_audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_user_roles_changes();

-- Trigger para auditar aprovações de pagamento
CREATE OR REPLACE FUNCTION public.audit_invoice_status_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.log_audit(
      'STATUS_CHANGE',
      'invoices',
      NEW.id,
      jsonb_build_object('old_status', OLD.status),
      jsonb_build_object('new_status', NEW.status, 'approved_by', auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_invoice_status ON public.invoices;
CREATE TRIGGER trigger_audit_invoice_status
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.audit_invoice_status_changes();

-- Trigger para auditar mudanças em tenants
CREATE OR REPLACE FUNCTION public.audit_tenant_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit('UPDATE', 'tenants', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_tenants ON public.tenants;
CREATE TRIGGER trigger_audit_tenants
  AFTER UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_tenant_changes();