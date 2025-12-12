-- Tabela para controle de sessões de IA por ticket (takeover)
CREATE TABLE public.ticket_ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_ai_active BOOLEAN DEFAULT TRUE,
  taken_over_by UUID REFERENCES profiles(id),
  taken_over_at TIMESTAMPTZ,
  returned_to_ai_at TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ticket_ai_sessions_ticket ON ticket_ai_sessions(ticket_id);
CREATE INDEX idx_ticket_ai_sessions_tenant ON ticket_ai_sessions(tenant_id);
CREATE INDEX idx_ticket_ai_sessions_active ON ticket_ai_sessions(is_ai_active);
CREATE UNIQUE INDEX idx_ticket_ai_sessions_unique_ticket ON ticket_ai_sessions(ticket_id);

-- RLS
ALTER TABLE ticket_ai_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI sessions in their tenant"
ON ticket_ai_sessions FOR SELECT
USING (has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can manage AI sessions in their tenant"
ON ticket_ai_sessions FOR ALL
USING (has_tenant_access(auth.uid(), tenant_id));

-- Adicionar coluna ai_provider ao chatbot_settings
ALTER TABLE chatbot_settings ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'lovable';

-- Trigger para updated_at
CREATE TRIGGER update_ticket_ai_sessions_updated_at
BEFORE UPDATE ON ticket_ai_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();