-- Atualizar constraint da tabela menu_items para incluir novos tipos de ação
-- Remover constraint antigo se existir
ALTER TABLE public.menu_items DROP CONSTRAINT IF EXISTS menu_items_action_type_check;

-- Adicionar novo constraint com todos os tipos de ação
ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_action_type_check 
CHECK (action_type IN (
  'queue', 
  'transfer', 
  'end', 
  'assistant', 
  'send_file',
  'media',
  'forward_to_queue',
  'send_evaluation',
  'assistant_gpt',
  'assistant_gemini',
  'assistant_grok'
));

-- Adicionar coluna de avaliação nas tabelas se não existir
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS evaluation_score INTEGER,
ADD COLUMN IF NOT EXISTS evaluation_feedback TEXT,
ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMP WITH TIME ZONE;

-- Criar tabela de configurações de IA se não existir
CREATE TABLE IF NOT EXISTS public.ai_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'google', 'xai')),
  api_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, provider)
);

-- RLS para ai_configs
ALTER TABLE public.ai_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins can manage AI configs" ON public.ai_configs
FOR ALL USING (
  has_role(auth.uid(), 'super_admin') OR 
  (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
);

-- Adicionar campos de empresa no tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS cnpj_cpf TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tickets_evaluation ON public.tickets(evaluation_score) WHERE evaluation_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_configs_tenant ON public.ai_configs(tenant_id);

COMMENT ON TABLE public.ai_configs IS 'Armazena configurações de API keys para provedores de IA (OpenAI, Google Gemini, xAI Grok)';
COMMENT ON COLUMN public.tickets.evaluation_score IS 'Pontuação da avaliação do atendimento (1-5)';
COMMENT ON COLUMN public.tenants.cnpj_cpf IS 'CNPJ ou CPF da empresa';
COMMENT ON COLUMN public.tenants.address IS 'Endereço completo da empresa';