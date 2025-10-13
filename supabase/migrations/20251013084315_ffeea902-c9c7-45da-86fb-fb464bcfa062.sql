-- ========================================
-- MÓDULO 2: SISTEMA DE PEDIDOS
-- ========================================

-- Adicionar campos extras em catalog_orders
ALTER TABLE public.catalog_orders
ADD COLUMN IF NOT EXISTS delivery_address JSONB,
ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP WITH TIME ZONE;

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS public.catalog_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.catalog_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.catalog_products(id),
  product_name TEXT NOT NULL,
  product_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC NOT NULL,
  variations JSONB DEFAULT '[]'::jsonb, -- [{name: "Tamanho", option: "Grande", price: 5}]
  optionals JSONB DEFAULT '[]'::jsonb, -- [{name: "Bacon", quantity: 2, price: 3}]
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de configurações de pedido do tenant
CREATE TABLE IF NOT EXISTS public.catalog_order_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  min_order_value NUMERIC DEFAULT 0,
  default_delivery_fee NUMERIC DEFAULT 0,
  free_delivery_above NUMERIC,
  accepts_scheduled_orders BOOLEAN DEFAULT true,
  working_hours JSONB DEFAULT '{"monday": {"open": "08:00", "close": "22:00"}, "tuesday": {"open": "08:00", "close": "22:00"}, "wednesday": {"open": "08:00", "close": "22:00"}, "thursday": {"open": "08:00", "close": "22:00"}, "friday": {"open": "08:00", "close": "22:00"}, "saturday": {"open": "08:00", "close": "22:00"}, "sunday": {"open": "08:00", "close": "22:00"}}'::jsonb,
  order_message TEXT DEFAULT 'Obrigado pelo seu pedido!',
  auto_print BOOLEAN DEFAULT false,
  sound_notification BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Gerar número de pedido automaticamente
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
BEGIN
  -- Formato: ORD-YYYYMMDD-NNNN
  SELECT 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         LPAD(CAST(COUNT(*) + 1 AS TEXT), 4, '0')
  INTO new_number
  FROM catalog_orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  RETURN new_number;
END;
$$;

-- Trigger para gerar número do pedido
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.catalog_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Índices
CREATE INDEX IF NOT EXISTS idx_catalog_order_items_order ON public.catalog_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_catalog_order_items_product ON public.catalog_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_catalog_orders_number ON public.catalog_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_catalog_orders_status ON public.catalog_orders(status);

-- RLS Policies para itens de pedido
ALTER TABLE public.catalog_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode ver itens de seus pedidos"
  ON public.catalog_order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.catalog_orders
      WHERE customer_email = current_setting('request.jwt.claims', true)::json->>'email'
      OR has_tenant_access(auth.uid(), tenant_id)
    )
  );

CREATE POLICY "Sistema pode criar itens de pedido"
  ON public.catalog_order_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Tenant admins podem atualizar itens"
  ON public.catalog_order_items
  FOR UPDATE
  USING (
    order_id IN (
      SELECT id FROM public.catalog_orders
      WHERE has_tenant_access(auth.uid(), tenant_id)
    )
  );

-- RLS Policies para configurações de pedido
ALTER TABLE public.catalog_order_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins podem gerenciar configurações"
  ON public.catalog_order_settings
  FOR ALL
  USING (has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Todos podem ver configurações ativas"
  ON public.catalog_order_settings
  FOR SELECT
  USING (true);

-- Trigger para updated_at
CREATE TRIGGER trigger_catalog_order_settings_updated_at
  BEFORE UPDATE ON public.catalog_order_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_catalog_updated_at();