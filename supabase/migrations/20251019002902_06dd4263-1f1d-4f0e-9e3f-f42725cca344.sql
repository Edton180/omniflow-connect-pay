-- Criar tabela para armazenar configurações de canais
CREATE TABLE IF NOT EXISTS channel_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  config_type TEXT NOT NULL, -- 'evolution_api', 'telegram', etc
  api_url TEXT,
  api_key_encrypted TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, config_type)
);

-- RLS para channel_configs
ALTER TABLE channel_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins can manage their channel configs"
ON channel_configs FOR ALL
USING (has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Super admins can manage all channel configs"
ON channel_configs FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Criar função para gerar faturas automaticamente quando assinatura expira
CREATE OR REPLACE FUNCTION auto_generate_invoice_on_expiry()
RETURNS TRIGGER AS $$
DECLARE
  new_due_date TIMESTAMPTZ;
  plan_record RECORD;
  tenant_gateway_id UUID;
BEGIN
  -- Se a assinatura expirou e ainda está ativa
  IF NEW.expires_at <= NOW() AND NEW.status = 'active' AND (OLD.expires_at IS NULL OR OLD.expires_at > NOW()) THEN
    
    -- Buscar informações do plano
    SELECT * INTO plan_record FROM plans WHERE id = NEW.plan_id;
    
    -- Calcular nova data de vencimento
    IF plan_record.billing_period = 'yearly' THEN
      new_due_date := NOW() + INTERVAL '7 days';
    ELSE
      new_due_date := NOW() + INTERVAL '7 days';
    END IF;
    
    -- Buscar gateway ativo do tenant
    SELECT id INTO tenant_gateway_id
    FROM payment_gateways
    WHERE tenant_id = NEW.tenant_id
    AND is_active = true
    LIMIT 1;
    
    -- Gerar fatura apenas se não existir uma pendente
    IF NOT EXISTS (
      SELECT 1 FROM invoices 
      WHERE subscription_id = NEW.id 
      AND status = 'pending'
    ) THEN
      INSERT INTO invoices (
        tenant_id,
        subscription_id,
        amount,
        currency,
        due_date,
        status,
        description,
        metadata
      ) VALUES (
        NEW.tenant_id,
        NEW.id,
        plan_record.price,
        plan_record.currency,
        new_due_date,
        'pending',
        'Renovação - ' || plan_record.name,
        jsonb_build_object(
          'gateway_id', tenant_gateway_id,
          'plan_name', plan_record.name,
          'billing_period', plan_record.billing_period,
          'auto_generated', true
        )
      );
      
      -- Atualizar status da assinatura para expirada
      NEW.status := 'expired';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para geração automática de faturas
DROP TRIGGER IF EXISTS trigger_auto_generate_invoice ON subscriptions;
CREATE TRIGGER trigger_auto_generate_invoice
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION auto_generate_invoice_on_expiry();

-- Função para notificar sobre faturas vencidas
CREATE OR REPLACE FUNCTION notify_overdue_invoices()
RETURNS void AS $$
BEGIN
  -- Atualizar status do tenant para expirado se houver faturas vencidas
  UPDATE tenants t
  SET subscription_status = 'expired'
  WHERE EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.tenant_id = t.id
    AND i.status = 'pending'
    AND i.due_date < NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;