-- Permitir que super admins salvem payment gateways sem tenant_id
ALTER TABLE payment_gateways ALTER COLUMN tenant_id DROP NOT NULL;

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_payment_gateways_tenant_gateway 
ON payment_gateways(tenant_id, gateway_name);

-- Atualizar políticas RLS para payment_gateways
DROP POLICY IF EXISTS "Tenant admins can manage their gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Super admins can manage all gateways" ON payment_gateways;

-- Super admins podem gerenciar todos os gateways (incluindo sem tenant)
CREATE POLICY "Super admins can manage all gateways"
ON payment_gateways
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Tenant admins podem gerenciar seus próprios gateways
CREATE POLICY "Tenant admins can manage their gateways"
ON payment_gateways
FOR ALL
USING (
  has_role(auth.uid(), 'tenant_admin') 
  AND tenant_id IS NOT NULL 
  AND has_tenant_access(auth.uid(), tenant_id)
)
WITH CHECK (
  has_role(auth.uid(), 'tenant_admin') 
  AND tenant_id IS NOT NULL 
  AND has_tenant_access(auth.uid(), tenant_id)
);

-- Usuários podem ver gateways do seu tenant
CREATE POLICY "Users can view their tenant gateways"
ON payment_gateways
FOR SELECT
USING (
  tenant_id IS NOT NULL 
  AND has_tenant_access(auth.uid(), tenant_id)
);