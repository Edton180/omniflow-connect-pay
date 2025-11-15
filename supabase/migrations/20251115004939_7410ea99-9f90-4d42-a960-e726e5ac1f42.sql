-- Criar tabelas de configuração de webhooks
CREATE TABLE IF NOT EXISTS public.webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  webhook_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, gateway)
);

-- Criar tabelas de notificações de faturas
CREATE TABLE IF NOT EXISTS public.invoice_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivery_method TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de customers dos gateways
CREATE TABLE IF NOT EXISTS public.gateway_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL,
  gateway_customer_id TEXT NOT NULL,
  customer_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, gateway)
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateway_customers ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
DROP POLICY IF EXISTS "Tenant admins can manage their webhook configs" ON public.webhook_configs;
CREATE POLICY "Tenant admins can manage their webhook configs"
  ON public.webhook_configs FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can view notifications in their tenant" ON public.invoice_notifications;
CREATE POLICY "Users can view notifications in their tenant"
  ON public.invoice_notifications FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Admins can manage gateway customers" ON public.gateway_customers;
CREATE POLICY "Admins can manage gateway customers"
  ON public.gateway_customers FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR
    (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
  );

-- Função para enviar notificações de faturas vencendo
CREATE OR REPLACE FUNCTION public.notify_due_invoices()
RETURNS void AS $$
DECLARE
  v_invoice RECORD;
BEGIN
  FOR v_invoice IN
    SELECT i.*, t.name as tenant_name
    FROM public.invoices i
    JOIN public.tenants t ON t.id = i.tenant_id
    WHERE i.status IN ('pending', 'overdue')
      AND i.due_date BETWEEN now() AND now() + INTERVAL '3 days'
      AND NOT EXISTS (
        SELECT 1 FROM public.invoice_notifications
        WHERE invoice_id = i.id 
          AND notification_type = 'due_soon'
          AND created_at > now() - INTERVAL '1 day'
      )
  LOOP
    INSERT INTO public.invoice_notifications (
      invoice_id,
      tenant_id,
      notification_type,
      delivery_method,
      status
    ) VALUES (
      v_invoice.id,
      v_invoice.tenant_id,
      'due_soon',
      'internal_message',
      'sent'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;