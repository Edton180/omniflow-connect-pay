-- ========================================
-- CORREÇÕES DE SEGURANÇA E ESTRUTURA
-- ========================================

-- 1. Adicionar trigger para criar perfil automático ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Função para associar automaticamente usuário a tenant
CREATE OR REPLACE FUNCTION public.auto_assign_tenant(_user_id uuid, _company_name text DEFAULT 'Minha Empresa')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id uuid;
  existing_tenant_id uuid;
BEGIN
  -- Verificar se usuário já tem tenant
  SELECT tenant_id INTO existing_tenant_id
  FROM user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  IF existing_tenant_id IS NOT NULL THEN
    RETURN existing_tenant_id;
  END IF;
  
  -- Criar novo tenant
  INSERT INTO tenants (name, slug, is_active)
  VALUES (
    _company_name,
    'tenant-' || substr(md5(random()::text), 1, 8),
    true
  )
  RETURNING id INTO new_tenant_id;
  
  -- Atualizar perfil do usuário
  UPDATE profiles
  SET tenant_id = new_tenant_id
  WHERE id = _user_id;
  
  -- Criar role de tenant_admin
  INSERT INTO user_roles (user_id, tenant_id, role)
  VALUES (_user_id, new_tenant_id, 'tenant_admin')
  ON CONFLICT DO NOTHING;
  
  RETURN new_tenant_id;
END;
$$;

-- 3. Adicionar coluna para verificar se usuário completou setup
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS setup_completed boolean DEFAULT false;

-- 4. Criar tabela de withdrawal_requests se não existir
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  bank_info jsonb,
  notes text,
  rejection_reason text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamp with time zone,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS para withdrawal_requests
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants podem ver seus saques"
  ON public.withdrawal_requests
  FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenants podem criar saques"
  ON public.withdrawal_requests
  FOR INSERT
  WITH CHECK (has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Super admins podem atualizar saques"
  ON public.withdrawal_requests
  FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'));

-- Índices
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_tenant ON public.withdrawal_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- Trigger para updated_at
CREATE TRIGGER trigger_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();