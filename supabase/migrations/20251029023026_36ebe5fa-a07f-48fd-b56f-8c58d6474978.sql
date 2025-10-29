-- Criar tabela de menus do canal
CREATE TABLE IF NOT EXISTS public.channel_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  parent_menu_id UUID REFERENCES public.channel_menus(id) ON DELETE CASCADE,
  greeting_message TEXT,
  timeout_message TEXT,
  offline_message TEXT,
  timeout_seconds INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de itens do menu
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.channel_menus(id) ON DELETE CASCADE,
  option_key TEXT NOT NULL, -- número, texto ou ID do botão
  option_label TEXT NOT NULL, -- texto que aparece pro usuário
  action_type TEXT NOT NULL CHECK (action_type IN ('queue', 'assistant', 'submenu', 'webhook', 'message')),
  target_id UUID, -- ID da fila, submenu, etc
  target_data JSONB, -- dados extras (prompt do assistente, URL webhook, texto da mensagem)
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(menu_id, option_key)
);

-- Criar tabela de metadata de conversas
CREATE TABLE IF NOT EXISTS public.conversation_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.channels(id),
  contact_id UUID NOT NULL REFERENCES public.contacts(id),
  menu_id UUID REFERENCES public.channel_menus(id),
  menu_item_id UUID REFERENCES public.menu_items(id),
  user_choice TEXT,
  routed_to TEXT, -- 'queue', 'assistant', 'agent'
  routed_via TEXT, -- 'menu', 'automatic', 'manual'
  routed_target_id UUID, -- ID da fila ou assistente
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar colunas em channels para configurações
ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS chatbot_config JSONB DEFAULT '{}';

-- Adicionar colunas em user_queues para função e status
ALTER TABLE public.user_queues
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'agent' CHECK (role IN ('agent', 'supervisor', 'admin')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_takeover_ai BOOLEAN DEFAULT false;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_channel_menus_channel ON public.channel_menus(channel_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_menu ON public.menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_conversation_metadata_ticket ON public.conversation_metadata(ticket_id);
CREATE INDEX IF NOT EXISTS idx_conversation_metadata_contact ON public.conversation_metadata(contact_id);

-- Habilitar RLS
ALTER TABLE public.channel_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_metadata ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para channel_menus
CREATE POLICY "Users can view menus in their tenant"
  ON public.channel_menus FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM public.channels 
      WHERE has_tenant_access(auth.uid(), tenant_id)
    )
  );

CREATE POLICY "Admins can manage menus in their tenant"
  ON public.channel_menus FOR ALL
  USING (
    channel_id IN (
      SELECT id FROM public.channels 
      WHERE has_tenant_access(auth.uid(), tenant_id)
        AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'tenant_admin'))
    )
  );

-- Políticas RLS para menu_items
CREATE POLICY "Users can view menu items in their tenant"
  ON public.menu_items FOR SELECT
  USING (
    menu_id IN (
      SELECT cm.id FROM public.channel_menus cm
      JOIN public.channels c ON c.id = cm.channel_id
      WHERE has_tenant_access(auth.uid(), c.tenant_id)
    )
  );

CREATE POLICY "Admins can manage menu items in their tenant"
  ON public.menu_items FOR ALL
  USING (
    menu_id IN (
      SELECT cm.id FROM public.channel_menus cm
      JOIN public.channels c ON c.id = cm.channel_id
      WHERE has_tenant_access(auth.uid(), c.tenant_id)
        AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'tenant_admin'))
    )
  );

-- Políticas RLS para conversation_metadata
CREATE POLICY "Users can view conversation metadata in their tenant"
  ON public.conversation_metadata FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM public.tickets 
      WHERE has_tenant_access(auth.uid(), tenant_id)
    )
  );

CREATE POLICY "Users can insert conversation metadata"
  ON public.conversation_metadata FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.tickets 
      WHERE has_tenant_access(auth.uid(), tenant_id)
    )
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_channel_menu_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_channel_menus_updated_at
  BEFORE UPDATE ON public.channel_menus
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_menu_updated_at();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_menu_updated_at();