
-- =====================================================
-- FASE 1: CORREÇÕES DE SEGURANÇA
-- =====================================================

-- Corrigir functions sem search_path fixo
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_access(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.tenant_id = _tenant_id
  ) OR public.has_role(_user_id, 'super_admin')
$$;

-- =====================================================
-- FASE 2: TABELA DE TEMPLATES WABA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.waba_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt_BR',
  category TEXT NOT NULL DEFAULT 'UTILITY',
  status TEXT NOT NULL DEFAULT 'PENDING',
  components JSONB DEFAULT '[]'::jsonb,
  rejected_reason TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, template_name, language)
);

ALTER TABLE public.waba_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage WABA templates in their tenant"
  ON public.waba_templates FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR 
         (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id)));

CREATE POLICY "Users can view WABA templates in their tenant"
  ON public.waba_templates FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

-- =====================================================
-- FASE 3: TABELA DE CONFIGURAÇÃO N8N
-- =====================================================

CREATE TABLE IF NOT EXISTS public.n8n_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  api_key TEXT,
  is_active BOOLEAN DEFAULT true,
  triggers JSONB DEFAULT '{"new_ticket": true, "new_message": true, "status_change": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id)
);

ALTER TABLE public.n8n_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins can manage N8N configs"
  ON public.n8n_configs FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR 
         (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id)));

-- =====================================================
-- FASE 4: TABELA DE CAMPANHAS BROADCAST
-- =====================================================

CREATE TABLE IF NOT EXISTS public.broadcast_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT,
  media_url TEXT,
  media_type TEXT,
  template_name TEXT,
  template_params JSONB,
  contact_filter JSONB DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  total_contacts INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.broadcast_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage broadcast campaigns in their tenant"
  ON public.broadcast_campaigns FOR ALL
  USING (has_tenant_access(auth.uid(), tenant_id));

-- Tabela de destinatários de broadcast
CREATE TABLE IF NOT EXISTS public.broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES broadcast_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  waba_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.broadcast_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage broadcast recipients via campaign"
  ON public.broadcast_recipients FOR ALL
  USING (campaign_id IN (
    SELECT id FROM broadcast_campaigns WHERE has_tenant_access(auth.uid(), tenant_id)
  ));

-- =====================================================
-- FASE 5: TABELA DE SYNC STATUS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.channel_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL DEFAULT 'messages',
  is_syncing BOOLEAN DEFAULT false,
  progress INT DEFAULT 0,
  total_items INT DEFAULT 0,
  synced_items INT DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, sync_type)
);

ALTER TABLE public.channel_sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync status in their tenant"
  ON public.channel_sync_status FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "System can manage sync status"
  ON public.channel_sync_status FOR ALL
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_waba_templates_updated_at
  BEFORE UPDATE ON public.waba_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_n8n_configs_updated_at
  BEFORE UPDATE ON public.n8n_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_broadcast_campaigns_updated_at
  BEFORE UPDATE ON public.broadcast_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_sync_status_updated_at
  BEFORE UPDATE ON public.channel_sync_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Realtime para sync status
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_sync_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_campaigns;
