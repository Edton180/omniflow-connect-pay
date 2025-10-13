-- ========================================
-- MÓDULO 1: CATEGORIAS E PRODUTOS AVANÇADOS
-- ========================================

-- Tabela de categorias de produtos
CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.catalog_categories(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar category_id aos produtos existentes
ALTER TABLE public.catalog_products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.catalog_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS has_variations BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preparation_time INTEGER DEFAULT 0, -- tempo em minutos
ADD COLUMN IF NOT EXISTS highlight BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_quantity_per_order INTEGER;

-- Tabela de variações de produto (tamanhos, sabores, etc)
CREATE TABLE IF NOT EXISTS public.catalog_product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.catalog_products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Ex: "Tamanho", "Sabor"
  option_name TEXT NOT NULL, -- Ex: "Grande", "Calabresa"
  price_adjustment NUMERIC DEFAULT 0, -- Ajuste no preço base
  is_default BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de opcionais/complementos
CREATE TABLE IF NOT EXISTS public.catalog_product_optionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.catalog_products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Ex: "Borda Recheada", "Bacon Extra"
  price NUMERIC NOT NULL DEFAULT 0,
  max_quantity INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_catalog_categories_tenant ON public.catalog_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_parent ON public.catalog_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_category ON public.catalog_products(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_product_variations_product ON public.catalog_product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_catalog_product_optionals_product ON public.catalog_product_optionals(product_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_catalog_category_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_catalog_categories_updated_at
  BEFORE UPDATE ON public.catalog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_catalog_category_updated_at();

-- RLS Policies para categorias
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins podem gerenciar suas categorias"
  ON public.catalog_categories
  FOR ALL
  USING (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Todos podem ver categorias ativas"
  ON public.catalog_categories
  FOR SELECT
  USING (is_active = true);

-- RLS Policies para variações
ALTER TABLE public.catalog_product_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins podem gerenciar variações"
  ON public.catalog_product_variations
  FOR ALL
  USING (
    product_id IN (
      SELECT id FROM public.catalog_products 
      WHERE has_role(auth.uid(), 'tenant_admin') 
      AND has_tenant_access(auth.uid(), tenant_id)
    )
  );

CREATE POLICY "Todos podem ver variações ativas"
  ON public.catalog_product_variations
  FOR SELECT
  USING (is_active = true);

-- RLS Policies para opcionais
ALTER TABLE public.catalog_product_optionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins podem gerenciar opcionais"
  ON public.catalog_product_optionals
  FOR ALL
  USING (
    product_id IN (
      SELECT id FROM public.catalog_products 
      WHERE has_role(auth.uid(), 'tenant_admin') 
      AND has_tenant_access(auth.uid(), tenant_id)
    )
  );

CREATE POLICY "Todos podem ver opcionais ativos"
  ON public.catalog_product_optionals
  FOR SELECT
  USING (is_active = true);