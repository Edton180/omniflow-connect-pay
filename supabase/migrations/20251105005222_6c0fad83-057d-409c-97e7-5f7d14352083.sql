-- 1. Atualizar constraint de action_type em menu_items incluindo valores existentes
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_action_type_check;
ALTER TABLE menu_items ADD CONSTRAINT menu_items_action_type_check 
CHECK (action_type IN (
  'forward_to_queue',
  'forward_to_user', 
  'send_message',
  'send_file',
  'send_evaluation',
  'assistant_gpt',
  'assistant_gemini',
  'assistant_grok',
  'submenu',
  'end_chat',
  'create_ticket',
  'media',
  'queue'
));

-- 2. Criar tabela de avaliações
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view evaluations in their tenant"
  ON evaluations FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can create evaluations in their tenant"
  ON evaluations FOR INSERT
  WITH CHECK (has_tenant_access(auth.uid(), tenant_id));

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_evaluations_tenant ON evaluations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_agent ON evaluations(agent_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_ticket ON evaluations(ticket_id);

-- 4. View para ranking
CREATE OR REPLACE VIEW evaluation_rankings AS
SELECT 
  e.agent_id,
  p.full_name as agent_name,
  e.tenant_id,
  COUNT(*) as total_evaluations,
  ROUND(AVG(e.score), 2) as average_score,
  COUNT(CASE WHEN e.score = 5 THEN 1 END) as excellent_count,
  COUNT(CASE WHEN e.score >= 4 THEN 1 END) as good_count,
  COUNT(CASE WHEN e.score <= 2 THEN 1 END) as poor_count
FROM evaluations e
LEFT JOIN profiles p ON e.agent_id = p.id
GROUP BY e.agent_id, p.full_name, e.tenant_id;

GRANT SELECT ON evaluation_rankings TO authenticated;