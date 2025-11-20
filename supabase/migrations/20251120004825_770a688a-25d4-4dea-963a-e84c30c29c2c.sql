-- =====================================================
-- FIX: Corrigir políticas RLS para system_secrets e payment_gateways
-- =====================================================

-- 1. Remover política INSERT antiga de system_secrets (sem WITH CHECK)
DROP POLICY IF EXISTS "Only super admins can insert system secrets" ON system_secrets;

-- 2. Recriar política INSERT com WITH CHECK correto
CREATE POLICY "Only super admins can insert system secrets"
ON system_secrets
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  )
);

-- 3. Remover políticas antigas de payment_gateways para recriá-las
DROP POLICY IF EXISTS "Super admins have full access to payment gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Tenant admins can manage their gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Tenant admins can manage their tenant gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Users can view available gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Users can view their tenant gateways" ON payment_gateways;

-- 4. Criar políticas RLS otimizadas para payment_gateways

-- Super admins têm acesso completo (global e tenant)
CREATE POLICY "Super admins full access to all payment gateways"
ON payment_gateways
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  )
);

-- Tenant admins podem gerenciar apenas seus próprios gateways (tenant_id não-nulo)
CREATE POLICY "Tenant admins manage their own gateways"
ON payment_gateways
FOR ALL
TO authenticated
USING (
  tenant_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'tenant_admin'
      AND tenant_id = payment_gateways.tenant_id
  )
)
WITH CHECK (
  tenant_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'tenant_admin'
      AND tenant_id = payment_gateways.tenant_id
  )
);

-- Todos usuários autenticados podem visualizar gateways globais (tenant_id IS NULL)
CREATE POLICY "All authenticated users can view global gateways"
ON payment_gateways
FOR SELECT
TO authenticated
USING (
  tenant_id IS NULL
);

-- Usuários podem visualizar gateways do seu tenant
CREATE POLICY "Users can view their tenant gateways"
ON payment_gateways
FOR SELECT
TO authenticated
USING (
  tenant_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND tenant_id = payment_gateways.tenant_id
  )
);

-- 5. Comentários para documentação
COMMENT ON POLICY "Super admins full access to all payment gateways" ON payment_gateways IS 
'Super admins podem criar, editar e deletar qualquer gateway (global ou de tenant)';

COMMENT ON POLICY "Tenant admins manage their own gateways" ON payment_gateways IS 
'Tenant admins podem gerenciar apenas gateways do seu próprio tenant';

COMMENT ON POLICY "All authenticated users can view global gateways" ON payment_gateways IS 
'Gateways globais (tenant_id NULL) são visíveis para todos usuários autenticados';

COMMENT ON POLICY "Users can view their tenant gateways" ON payment_gateways IS 
'Usuários podem visualizar gateways configurados para seu tenant';