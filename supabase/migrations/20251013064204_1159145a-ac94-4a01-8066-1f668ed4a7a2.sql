-- Limpa duplicatas mantendo apenas o registro mais recente de cada gateway
WITH duplicates AS (
  SELECT id, gateway_name, tenant_id,
         ROW_NUMBER() OVER (PARTITION BY gateway_name, COALESCE(tenant_id::text, 'NULL') ORDER BY created_at DESC) as rn
  FROM public.payment_gateways
)
DELETE FROM public.payment_gateways
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Cria índice único correto
-- Para super admin (tenant_id NULL), permite apenas um registro por gateway
-- Para tenants específicos, permite um registro por gateway por tenant
CREATE UNIQUE INDEX IF NOT EXISTS payment_gateways_unique_idx 
ON public.payment_gateways (gateway_name, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid));