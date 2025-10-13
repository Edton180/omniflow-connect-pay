-- Criar função para gerar faturas automaticamente quando assinaturas expiram
CREATE OR REPLACE FUNCTION public.check_and_generate_invoices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
  new_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar todas as assinaturas ativas que expiraram
  FOR sub_record IN 
    SELECT s.*, p.price, p.currency, p.name as plan_name, p.billing_period
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.status = 'active' 
    AND s.expires_at <= NOW()
  LOOP
    -- Calcular nova data de vencimento baseada no período de cobrança
    IF sub_record.billing_period = 'monthly' THEN
      new_due_date := NOW() + INTERVAL '30 days';
    ELSIF sub_record.billing_period = 'yearly' THEN
      new_due_date := NOW() + INTERVAL '365 days';
    ELSE
      new_due_date := NOW() + INTERVAL '30 days';
    END IF;

    -- Gerar fatura apenas se não existir uma fatura pendente para esta assinatura
    IF NOT EXISTS (
      SELECT 1 FROM invoices 
      WHERE subscription_id = sub_record.id 
      AND status = 'pending'
    ) THEN
      INSERT INTO invoices (
        tenant_id,
        subscription_id,
        amount,
        currency,
        due_date,
        status,
        description
      ) VALUES (
        sub_record.tenant_id,
        sub_record.id,
        sub_record.price,
        sub_record.currency,
        new_due_date,
        'pending',
        'Renovação - ' || sub_record.plan_name
      );
    END IF;

    -- Atualizar status da assinatura
    UPDATE subscriptions 
    SET status = 'expired'
    WHERE id = sub_record.id;

    -- Atualizar status do tenant
    UPDATE tenants
    SET 
      subscription_status = 'expired',
      expiry_date = NOW()
    WHERE id = sub_record.tenant_id;
  END LOOP;
END;
$$;

-- Criar função trigger para verificar assinaturas ao atualizar
CREATE OR REPLACE FUNCTION public.trigger_check_subscription_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se a data de expiração passou e status ainda é ativo
  IF NEW.expires_at <= NOW() AND NEW.status = 'active' THEN
    PERFORM public.check_and_generate_invoices();
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger para verificar ao atualizar subscriptions
DROP TRIGGER IF EXISTS check_subscription_expiry ON subscriptions;
CREATE TRIGGER check_subscription_expiry
AFTER UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_check_subscription_expiry();

-- Criar função para processar pagamento de fatura
CREATE OR REPLACE FUNCTION public.process_invoice_payment(invoice_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invoice_record RECORD;
  subscription_record RECORD;
  new_expires_at TIMESTAMP WITH TIME ZONE;
  result JSON;
BEGIN
  -- Buscar fatura
  SELECT * INTO invoice_record
  FROM invoices
  WHERE id = invoice_id_param;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Fatura não encontrada');
  END IF;

  IF invoice_record.status = 'paid' THEN
    RETURN json_build_object('success', false, 'error', 'Fatura já foi paga');
  END IF;

  -- Buscar assinatura relacionada
  IF invoice_record.subscription_id IS NOT NULL THEN
    SELECT * INTO subscription_record
    FROM subscriptions
    WHERE id = invoice_record.subscription_id;

    -- Calcular nova data de expiração
    IF subscription_record.status = 'expired' THEN
      -- Se expirou, começar de agora
      IF subscription_record.plan_id IN (SELECT id FROM plans WHERE billing_period = 'yearly') THEN
        new_expires_at := NOW() + INTERVAL '365 days';
      ELSE
        new_expires_at := NOW() + INTERVAL '30 days';
      END IF;
    ELSE
      -- Se ainda ativo, estender a partir da data atual de expiração
      IF subscription_record.plan_id IN (SELECT id FROM plans WHERE billing_period = 'yearly') THEN
        new_expires_at := subscription_record.expires_at + INTERVAL '365 days';
      ELSE
        new_expires_at := subscription_record.expires_at + INTERVAL '30 days';
      END IF;
    END IF;

    -- Atualizar assinatura
    UPDATE subscriptions
    SET 
      status = 'active',
      expires_at = new_expires_at
    WHERE id = subscription_record.id;

    -- Atualizar tenant
    UPDATE tenants
    SET 
      subscription_status = 'active',
      expiry_date = new_expires_at
    WHERE id = subscription_record.tenant_id;
  END IF;

  -- Atualizar fatura como paga
  UPDATE invoices
  SET 
    status = 'paid',
    paid_at = NOW()
  WHERE id = invoice_id_param;

  -- Registrar pagamento
  INSERT INTO payments (
    tenant_id,
    subscription_id,
    amount,
    currency,
    status,
    paid_at,
    payment_method,
    payment_gateway
  ) VALUES (
    invoice_record.tenant_id,
    invoice_record.subscription_id,
    invoice_record.amount,
    invoice_record.currency,
    'completed',
    NOW(),
    'manual',
    'manual'
  );

  result := json_build_object(
    'success', true,
    'message', 'Pagamento processado com sucesso',
    'new_expiry_date', new_expires_at
  );

  RETURN result;
END;
$$;