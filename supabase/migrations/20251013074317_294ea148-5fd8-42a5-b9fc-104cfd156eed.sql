-- Adicionar constraint única para evitar duplicatas e permitir UPSERT
-- Primeiro, remover duplicatas existentes se houver
DELETE FROM payment_gateways a
USING payment_gateways b
WHERE a.id > b.id 
  AND a.gateway_name = b.gateway_name 
  AND (
    (a.tenant_id = b.tenant_id) OR 
    (a.tenant_id IS NULL AND b.tenant_id IS NULL)
  );

-- Criar constraint única para (tenant_id, gateway_name)
-- Isso permite um gateway por tenant (ou um gateway global se tenant_id for NULL)
ALTER TABLE payment_gateways 
ADD CONSTRAINT payment_gateways_tenant_gateway_unique 
UNIQUE NULLS NOT DISTINCT (tenant_id, gateway_name);