-- Criar tabela para armazenar secrets do sistema de forma segura
CREATE TABLE IF NOT EXISTS public.system_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_name TEXT NOT NULL UNIQUE,
  secret_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.system_secrets ENABLE ROW LEVEL SECURITY;

-- Política: apenas super admins podem visualizar
CREATE POLICY "Only super admins can view system secrets"
  ON public.system_secrets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Política: apenas super admins podem inserir
CREATE POLICY "Only super admins can insert system secrets"
  ON public.system_secrets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Política: apenas super admins podem atualizar
CREATE POLICY "Only super admins can update system secrets"
  ON public.system_secrets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Política: apenas super admins podem deletar
CREATE POLICY "Only super admins can delete system secrets"
  ON public.system_secrets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_system_secrets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar timestamp
CREATE TRIGGER update_system_secrets_updated_at_trigger
  BEFORE UPDATE ON public.system_secrets
  FOR EACH ROW
  EXECUTE FUNCTION update_system_secrets_updated_at();

-- Inserir secrets padrão (valores vazios, para serem preenchidos pelo admin)
INSERT INTO public.system_secrets (secret_name, description, secret_value, created_by)
VALUES
  ('RESEND_API_KEY', 'Chave de API para envio de emails via Resend', '', NULL),
  ('ASAAS_WEBHOOK_TOKEN', 'Token de verificação para webhooks do ASAAS', '', NULL),
  ('STRIPE_WEBHOOK_SECRET', 'Secret para validação de webhooks do Stripe', '', NULL),
  ('MERCADOPAGO_WEBHOOK_SECRET', 'Secret para validação de webhooks do Mercado Pago', '', NULL),
  ('MERCADOPAGO_ACCESS_TOKEN', 'Token de acesso da API do Mercado Pago', '', NULL),
  ('INFINITEPAY_WEBHOOK_SECRET', 'Secret para validação de webhooks do InfinitePay', '', NULL)
ON CONFLICT (secret_name) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE public.system_secrets IS 'Armazena secrets do sistema de forma segura, acessível apenas para super admins';
COMMENT ON COLUMN public.system_secrets.secret_value IS 'Valor do secret (será exibido como senha no frontend)';
COMMENT ON COLUMN public.system_secrets.secret_name IS 'Nome único do secret (usado pelas edge functions)';