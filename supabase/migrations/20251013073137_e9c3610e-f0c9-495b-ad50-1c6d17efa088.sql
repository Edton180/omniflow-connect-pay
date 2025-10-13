-- Atualizar função para processar pagamentos de pedidos do catálogo
CREATE OR REPLACE FUNCTION public.check_and_generate_invoices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
  new_due_date TIMESTAMP WITH TIME ZONE;
  tenant_gateway_id UUID;
BEGIN
  -- Buscar todas as assinaturas ativas que expiraram
  FOR sub_record IN 
    SELECT s.*, p.price, p.currency, p.name as plan_name, p.billing_period
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.status = 'active' 
    AND s.expires_at <= NOW()
  LOOP
    -- Calcular nova data de vencimento baseada no período de cobrança
    IF sub_record.billing_period = 'monthly' THEN
      new_due_date := NOW() + INTERVAL '30 days';
    ELSIF sub_record.billing_period = 'yearly' THEN
      new_due_date := NOW() + INTERVAL '365 days';
    ELSE
      new_due_date := NOW() + INTERVAL '30 days';
    END IF;

    -- Buscar gateway de pagamento configurado do tenant
    SELECT id INTO tenant_gateway_id
    FROM payment_gateways
    WHERE tenant_id = sub_record.tenant_id
    AND is_active = true
    LIMIT 1;

    -- Gerar fatura apenas se não existir uma fatura pendente para esta assinatura
    IF NOT EXISTS (
      SELECT 1 FROM invoices 
      WHERE subscription_id = sub_record.id 
      AND status = 'pending'
    ) AND tenant_gateway_id IS NOT NULL THEN
      INSERT INTO invoices (
        tenant_id,
        subscription_id,
        amount,
        currency,
        due_date,
        status,
        description,
        metadata
      ) VALUES (
        sub_record.tenant_id,
        sub_record.id,
        sub_record.price,
        sub_record.currency,
        new_due_date,
        'pending',
        'Renovação - ' || sub_record.plan_name,
        jsonb_build_object('gateway_id', tenant_gateway_id)
      );
    END IF;

    -- Atualizar status da assinatura
    UPDATE subscriptions 
    SET status = 'expired'
    WHERE id = sub_record.id;

    -- Atualizar status do tenant
    UPDATE tenants
    SET 
      subscription_status = 'expired',
      expiry_date = NOW()
    WHERE id = sub_record.tenant_id;
  END LOOP;
END;
$$;

-- Criar tabela para configurações do editor de landing page do catálogo
CREATE TABLE IF NOT EXISTS public.catalog_landing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  hero_title TEXT NOT NULL DEFAULT 'Nosso Catálogo',
  hero_subtitle TEXT DEFAULT 'Confira nossos produtos',
  hero_image_url TEXT,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#8B5CF6',
  secondary_color TEXT NOT NULL DEFAULT '#3B82F6',
  footer_text TEXT DEFAULT '© 2025 Todos os direitos reservados.',
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  custom_css JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Enable RLS
ALTER TABLE public.catalog_landing_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para catalog_landing_settings
CREATE POLICY "Tenant admins podem gerenciar configurações da landing"
ON public.catalog_landing_settings
FOR ALL
USING (
  has_role(auth.uid(), 'tenant_admin') AND 
  has_tenant_access(auth.uid(), tenant_id)
);

CREATE POLICY "Todos podem ver configurações da landing ativa"
ON public.catalog_landing_settings
FOR SELECT
USING (is_active = true OR has_tenant_access(auth.uid(), tenant_id));

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_catalog_landing_tenant ON public.catalog_landing_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_tenant_active ON public.catalog_products(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_catalog_orders_tenant_status ON public.catalog_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_catalog_landing_settings_updated_at
  BEFORE UPDATE ON public.catalog_landing_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_catalog_updated_at();