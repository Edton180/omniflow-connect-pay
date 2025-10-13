-- Criar tabela de mensagens internas do chat
CREATE TABLE IF NOT EXISTS public.internal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view messages in their tenant"
  ON public.internal_messages FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id) AND (sender_id = auth.uid() OR recipient_id = auth.uid()));

CREATE POLICY "Users can send messages in their tenant"
  ON public.internal_messages FOR INSERT
  WITH CHECK (has_tenant_access(auth.uid(), tenant_id) AND sender_id = auth.uid());

CREATE POLICY "Recipients can mark as read"
  ON public.internal_messages FOR UPDATE
  USING (recipient_id = auth.uid());

-- Criar tabela de colunas do CRM (configuráveis)
CREATE TABLE IF NOT EXISTS public.crm_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, position)
);

-- RLS para colunas do CRM
ALTER TABLE public.crm_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage columns in their tenant"
  ON public.crm_columns FOR ALL
  USING (has_tenant_access(auth.uid(), tenant_id));

-- Criar tabela de leads do CRM
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES crm_columns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  value DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para leads
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage leads in their tenant"
  ON public.crm_leads FOR ALL
  USING (has_tenant_access(auth.uid(), tenant_id));

-- Adicionar campos ao tenants para suportar webhook e expiry_date
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);

-- Habilitar realtime para mensagens internas
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_columns;

-- Inserir colunas padrão do CRM para todos os tenants existentes
INSERT INTO public.crm_columns (tenant_id, name, color, position)
SELECT 
  t.id,
  column_data.name,
  column_data.color,
  column_data.position
FROM 
  public.tenants t,
  (VALUES 
    ('Lead', '#94a3b8', 0),
    ('Primeiro Contato', '#3b82f6', 1),
    ('Proposta Enviada', '#f59e0b', 2),
    ('Negociação', '#8b5cf6', 3),
    ('Fechado', '#10b981', 4)
  ) AS column_data(name, color, position)
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_columns cc WHERE cc.tenant_id = t.id
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_crm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_columns_updated_at
  BEFORE UPDATE ON public.crm_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_updated_at();

CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_updated_at();