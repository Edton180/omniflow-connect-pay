-- Criar tabela de configurações de avaliação
CREATE TABLE IF NOT EXISTS public.evaluation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  rating_scale INTEGER DEFAULT 5 CHECK (rating_scale IN (3, 5, 10)),
  message_template TEXT DEFAULT 'Como você avalia nosso atendimento?',
  thank_you_message TEXT DEFAULT 'Obrigado pela sua avaliação!',
  auto_send_on_close BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Enable RLS
ALTER TABLE public.evaluation_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenant admins can manage evaluation settings"
  ON public.evaluation_settings
  FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin'::text) OR 
    (has_role(auth.uid(), 'tenant_admin'::text) AND has_tenant_access(auth.uid(), tenant_id))
  );

CREATE POLICY "Users can view evaluation settings in their tenant"
  ON public.evaluation_settings
  FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_evaluation_settings_updated_at
  BEFORE UPDATE ON public.evaluation_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();