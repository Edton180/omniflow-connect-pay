-- Criar tabela para base de conhecimento da IA
CREATE TABLE public.ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('faq', 'document', 'example', 'instruction')),
  title TEXT,
  question TEXT,
  answer TEXT,
  content TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_ai_knowledge_base_tenant ON public.ai_knowledge_base(tenant_id);
CREATE INDEX idx_ai_knowledge_base_type ON public.ai_knowledge_base(type);
CREATE INDEX idx_ai_knowledge_base_active ON public.ai_knowledge_base(is_active);

-- Habilitar RLS
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view knowledge base in their tenant"
  ON public.ai_knowledge_base
  FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Admins can manage knowledge base"
  ON public.ai_knowledge_base
  FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
  );

-- Trigger para updated_at
CREATE TRIGGER update_ai_knowledge_base_updated_at
  BEFORE UPDATE ON public.ai_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();