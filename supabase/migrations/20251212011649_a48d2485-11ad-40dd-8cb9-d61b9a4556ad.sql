-- Tabela de Métricas de Tickets para Analytics
CREATE TABLE public.ticket_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES profiles(id),
  channel TEXT NOT NULL,
  
  -- Tempos em segundos
  first_response_time_seconds INTEGER,
  resolution_time_seconds INTEGER,
  wait_time_seconds INTEGER,
  
  -- Contadores
  message_count INTEGER DEFAULT 0,
  agent_message_count INTEGER DEFAULT 0,
  contact_message_count INTEGER DEFAULT 0,
  transfer_count INTEGER DEFAULT 0,
  
  -- Período
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  CONSTRAINT fk_ticket_metrics_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_ticket_metrics_tenant ON ticket_metrics(tenant_id);
CREATE INDEX idx_ticket_metrics_agent ON ticket_metrics(agent_id);
CREATE INDEX idx_ticket_metrics_created ON ticket_metrics(created_at);
CREATE INDEX idx_ticket_metrics_channel ON ticket_metrics(channel);

-- RLS
ALTER TABLE public.ticket_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metrics in their tenant"
  ON public.ticket_metrics FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "System can insert metrics"
  ON public.ticket_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update metrics"
  ON public.ticket_metrics FOR UPDATE
  USING (true);

-- Tabela de Intenções do Chatbot
CREATE TABLE public.chatbot_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  examples JSONB DEFAULT '[]'::jsonb,
  response TEXT,
  action TEXT DEFAULT 'respond',
  confidence_threshold NUMERIC DEFAULT 0.8,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chatbot_intents_tenant ON chatbot_intents(tenant_id);
CREATE INDEX idx_chatbot_intents_active ON chatbot_intents(is_active);

-- RLS
ALTER TABLE public.chatbot_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage chatbot intents"
  ON public.chatbot_intents FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR 
         (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id)));

CREATE POLICY "Users can view chatbot intents in their tenant"
  ON public.chatbot_intents FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

-- Tabela de Configurações do Chatbot
CREATE TABLE public.chatbot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,
  default_confidence_threshold NUMERIC DEFAULT 0.7,
  fallback_message TEXT DEFAULT 'Não entendi sua mensagem. Vou transferir você para um atendente.',
  transfer_message TEXT DEFAULT 'Aguarde um momento, estou transferindo você para um atendente.',
  welcome_message TEXT DEFAULT 'Olá! Sou o assistente virtual. Como posso ajudar?',
  enabled_channels JSONB DEFAULT '["telegram", "whatsapp", "webchat"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chatbot_settings_tenant ON chatbot_settings(tenant_id);

-- RLS
ALTER TABLE public.chatbot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage chatbot settings"
  ON public.chatbot_settings FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR 
         (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id)));

CREATE POLICY "Users can view chatbot settings in their tenant"
  ON public.chatbot_settings FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

-- Trigger para updated_at
CREATE TRIGGER update_chatbot_intents_updated_at
  BEFORE UPDATE ON public.chatbot_intents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chatbot_settings_updated_at
  BEFORE UPDATE ON public.chatbot_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();