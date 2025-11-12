-- Adicionar campo para configurar se assinatura de mensagens é permitida no tenant
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS allow_agent_signature boolean DEFAULT true;

COMMENT ON COLUMN tenants.allow_agent_signature IS 'Permite que agentes adicionem assinatura nas mensagens';