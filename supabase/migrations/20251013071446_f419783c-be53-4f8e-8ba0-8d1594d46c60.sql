-- Criar tabelas para o sistema de catálogo online e saques

-- Tabela de produtos do catálogo
CREATE TABLE IF NOT EXISTS public.catalog_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de pedidos do catálogo
CREATE TABLE IF NOT EXISTS public.catalog_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.catalog_products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  platform_commission_percent NUMERIC NOT NULL DEFAULT 0 CHECK (platform_commission_percent >= 0 AND platform_commission_percent <= 100),
  platform_commission_amount NUMERIC NOT NULL DEFAULT 0 CHECK (platform_commission_amount >= 0),
  tenant_amount NUMERIC NOT NULL CHECK (tenant_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  payment_gateway TEXT,
  gateway_payment_id TEXT,
  gateway_response JSONB,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de configurações do catálogo (landing page)
CREATE TABLE IF NOT EXISTS public.catalog_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  hero_title TEXT NOT NULL DEFAULT 'Nossos Produtos',
  hero_subtitle TEXT DEFAULT 'Confira nossos produtos e serviços',
  hero_image_url TEXT,
  primary_color TEXT DEFAULT '#8B5CF6',
  secondary_color TEXT DEFAULT '#3B82F6',
  logo_url TEXT,
  footer_text TEXT DEFAULT '© 2025 Todos os direitos reservados.',
  custom_css JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Tabela de configuração global do catálogo (super admin)
CREATE TABLE IF NOT EXISTS public.global_catalog_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_percent NUMERIC NOT NULL DEFAULT 5 CHECK (commission_percent >= 0 AND commission_percent <= 100),
  hero_title TEXT DEFAULT 'Catálogos Online',
  hero_subtitle TEXT DEFAULT 'Venda seus produtos online',
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir configuração global padrão
INSERT INTO public.global_catalog_settings (commission_percent, is_enabled)
VALUES (5, true)
ON CONFLICT DO NOTHING;

-- Tabela de solicitações de saque
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  bank_info JSONB NOT NULL,
  notes TEXT,
  requested_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de saldo dos tenants
CREATE TABLE IF NOT EXISTS public.tenant_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  available_balance NUMERIC NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance NUMERIC NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
  total_earned NUMERIC NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  total_withdrawn NUMERIC NOT NULL DEFAULT 0 CHECK (total_withdrawn >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies para catalog_products
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver produtos ativos"
ON public.catalog_products FOR SELECT
USING (is_active = true);

CREATE POLICY "Tenant admins podem gerenciar seus produtos"
ON public.catalog_products FOR ALL
USING (
  has_role(auth.uid(), 'tenant_admin') AND 
  has_tenant_access(auth.uid(), tenant_id)
);

-- RLS Policies para catalog_orders
ALTER TABLE public.catalog_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants podem ver seus pedidos"
ON public.catalog_orders FOR SELECT
USING (has_tenant_access(auth.uid(), tenant_id) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Qualquer um pode criar pedidos"
ON public.catalog_orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Tenant admins podem atualizar pedidos"
ON public.catalog_orders FOR UPDATE
USING (
  has_role(auth.uid(), 'tenant_admin') AND 
  has_tenant_access(auth.uid(), tenant_id)
);

-- RLS Policies para catalog_settings
ALTER TABLE public.catalog_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver configurações do catálogo"
ON public.catalog_settings FOR SELECT
USING (is_active = true OR has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins podem gerenciar suas configurações"
ON public.catalog_settings FOR ALL
USING (
  has_role(auth.uid(), 'tenant_admin') AND 
  has_tenant_access(auth.uid(), tenant_id)
);

-- RLS Policies para global_catalog_settings
ALTER TABLE public.global_catalog_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver configurações globais"
ON public.global_catalog_settings FOR SELECT
USING (true);

CREATE POLICY "Apenas super admins podem gerenciar configurações globais"
ON public.global_catalog_settings FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- RLS Policies para withdrawal_requests
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants podem ver suas solicitações"
ON public.withdrawal_requests FOR SELECT
USING (has_tenant_access(auth.uid(), tenant_id) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins podem criar solicitações"
ON public.withdrawal_requests FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'tenant_admin') AND 
  has_tenant_access(auth.uid(), tenant_id)
);

CREATE POLICY "Super admins podem atualizar solicitações"
ON public.withdrawal_requests FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'));

-- RLS Policies para tenant_balances
ALTER TABLE public.tenant_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants podem ver seu saldo"
ON public.tenant_balances FOR SELECT
USING (has_tenant_access(auth.uid(), tenant_id) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Sistema pode atualizar saldos"
ON public.tenant_balances FOR ALL
USING (has_role(auth.uid(), 'super_admin') OR has_tenant_access(auth.uid(), tenant_id));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_catalog_products_updated_at
BEFORE UPDATE ON public.catalog_products
FOR EACH ROW EXECUTE FUNCTION update_catalog_updated_at();

CREATE TRIGGER update_catalog_orders_updated_at
BEFORE UPDATE ON public.catalog_orders
FOR EACH ROW EXECUTE FUNCTION update_catalog_updated_at();

CREATE TRIGGER update_catalog_settings_updated_at
BEFORE UPDATE ON public.catalog_settings
FOR EACH ROW EXECUTE FUNCTION update_catalog_updated_at();

CREATE TRIGGER update_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION update_catalog_updated_at();

CREATE TRIGGER update_tenant_balances_updated_at
BEFORE UPDATE ON public.tenant_balances
FOR EACH ROW EXECUTE FUNCTION update_catalog_updated_at();

-- Função para processar pagamento de pedido do catálogo
CREATE OR REPLACE FUNCTION process_catalog_order_payment(order_id_param UUID)
RETURNS JSON AS $$
DECLARE
  order_record RECORD;
  tenant_balance_record RECORD;
  commission_config RECORD;
BEGIN
  -- Buscar pedido
  SELECT * INTO order_record
  FROM catalog_orders
  WHERE id = order_id_param;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pedido não encontrado');
  END IF;

  IF order_record.status = 'paid' THEN
    RETURN json_build_object('success', false, 'error', 'Pedido já foi pago');
  END IF;

  -- Buscar configuração de comissão
  SELECT * INTO commission_config
  FROM global_catalog_settings
  LIMIT 1;

  -- Calcular valores
  DECLARE
    platform_commission NUMERIC;
    tenant_amount NUMERIC;
  BEGIN
    platform_commission := order_record.total_amount * (COALESCE(commission_config.commission_percent, 5) / 100);
    tenant_amount := order_record.total_amount - platform_commission;

    -- Atualizar pedido
    UPDATE catalog_orders
    SET 
      status = 'paid',
      paid_at = NOW(),
      platform_commission_percent = COALESCE(commission_config.commission_percent, 5),
      platform_commission_amount = platform_commission,
      tenant_amount = tenant_amount
    WHERE id = order_id_param;

    -- Atualizar saldo do tenant
    INSERT INTO tenant_balances (tenant_id, available_balance, total_earned)
    VALUES (order_record.tenant_id, tenant_amount, tenant_amount)
    ON CONFLICT (tenant_id) DO UPDATE
    SET 
      available_balance = tenant_balances.available_balance + tenant_amount,
      total_earned = tenant_balances.total_earned + tenant_amount,
      updated_at = NOW();

    RETURN json_build_object(
      'success', true,
      'message', 'Pagamento processado com sucesso',
      'platform_commission', platform_commission,
      'tenant_amount', tenant_amount
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;