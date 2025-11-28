-- FASE 1: Agent Capacity & Workload Management
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_concurrent_tickets INTEGER DEFAULT 10;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_ticket_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION update_agent_ticket_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to) THEN
    -- Incrementar novo agente
    IF NEW.assigned_to IS NOT NULL THEN
      UPDATE profiles SET current_ticket_count = current_ticket_count + 1 WHERE id = NEW.assigned_to;
    END IF;
    -- Decrementar agente anterior (se UPDATE)
    IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT NULL THEN
      UPDATE profiles SET current_ticket_count = GREATEST(0, current_ticket_count - 1) WHERE id = OLD.assigned_to;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.assigned_to IS NOT NULL THEN
    UPDATE profiles SET current_ticket_count = GREATEST(0, current_ticket_count - 1) WHERE id = OLD.assigned_to;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_agent_ticket_count ON tickets;
CREATE TRIGGER trigger_update_agent_ticket_count
  AFTER INSERT OR UPDATE OR DELETE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_ticket_count();

-- FASE 3: Sistema de Automations
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  trigger_type TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automations_tenant_id ON automations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automations_is_active ON automations(is_active);
CREATE INDEX IF NOT EXISTS idx_automations_trigger_type ON automations(trigger_type);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage automations in their tenant" ON automations;
CREATE POLICY "Admins can manage automations in their tenant"
  ON automations FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can view automations in their tenant" ON automations;
CREATE POLICY "Users can view automations in their tenant"
  ON automations FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

-- FASE 4: Private Notes
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS mentioned_users UUID[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_messages_is_private ON messages(is_private);

-- FASE 6: Contact Notes
CREATE TABLE IF NOT EXISTS contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON contact_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_tenant_id ON contact_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_created_by ON contact_notes(created_by);

ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view contact notes in their tenant" ON contact_notes;
CREATE POLICY "Users can view contact notes in their tenant"
  ON contact_notes FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Users can create contact notes in their tenant" ON contact_notes;
CREATE POLICY "Users can create contact notes in their tenant"
  ON contact_notes FOR INSERT
  WITH CHECK (has_tenant_access(auth.uid(), tenant_id) AND created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own contact notes" ON contact_notes;
CREATE POLICY "Users can update their own contact notes"
  ON contact_notes FOR UPDATE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own contact notes" ON contact_notes;
CREATE POLICY "Users can delete their own contact notes"
  ON contact_notes FOR DELETE
  USING (created_by = auth.uid());

-- FASE 7: Agent Performance View
CREATE MATERIALIZED VIEW IF NOT EXISTS agent_performance AS
SELECT 
  p.id as agent_id,
  p.full_name,
  p.tenant_id,
  COUNT(t.id) as total_tickets,
  COUNT(CASE WHEN t.status = 'closed' THEN 1 END) as closed_tickets,
  AVG(CASE WHEN t.status = 'closed' THEN EXTRACT(EPOCH FROM (t.closed_at - t.created_at))/60 END) as avg_resolution_min,
  AVG(e.score) as avg_satisfaction
FROM profiles p
LEFT JOIN tickets t ON t.assigned_to = p.id AND t.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN evaluations e ON e.agent_id = p.id AND e.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.full_name, p.tenant_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_performance_agent_id ON agent_performance(agent_id);

-- FASE 10: Pre-Chat Forms
CREATE TABLE IF NOT EXISTS pre_chat_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pre_chat_forms_channel_id ON pre_chat_forms(channel_id);
CREATE INDEX IF NOT EXISTS idx_pre_chat_forms_tenant_id ON pre_chat_forms(tenant_id);

ALTER TABLE pre_chat_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage pre-chat forms in their tenant" ON pre_chat_forms;
CREATE POLICY "Admins can manage pre-chat forms in their tenant"
  ON pre_chat_forms FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can view pre-chat forms in their tenant" ON pre_chat_forms;
CREATE POLICY "Users can view pre-chat forms in their tenant"
  ON pre_chat_forms FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));