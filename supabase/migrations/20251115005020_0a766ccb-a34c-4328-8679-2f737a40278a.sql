-- Corrigir search_path nas funções criadas
CREATE OR REPLACE FUNCTION public.ensure_webhook_idempotency(
  p_gateway TEXT,
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  SELECT id INTO v_log_id
  FROM public.webhook_logs
  WHERE gateway = p_gateway 
    AND event_id = p_event_id
    AND status = 'processed';
  
  IF v_log_id IS NOT NULL THEN
    RAISE EXCEPTION 'Webhook já processado anteriormente'
      USING HINT = v_log_id::TEXT;
  END IF;
  
  INSERT INTO public.webhook_logs (gateway, event_type, event_id, payload, status)
  VALUES (p_gateway, p_event_type, p_event_id, p_payload, 'processing')
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.process_invoice_payment(
  p_invoice_id UUID,
  p_payment_id UUID DEFAULT NULL,
  p_gateway TEXT DEFAULT NULL,
  p_gateway_payment_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_invoice RECORD;
  v_subscription RECORD;
  v_new_expiry_date TIMESTAMPTZ;
  v_plan RECORD;
BEGIN
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Fatura não encontrada'
    );
  END IF;
  
  IF v_invoice.status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Fatura já foi paga anteriormente'
    );
  END IF;
  
  UPDATE public.invoices
  SET 
    status = 'paid',
    paid_at = now(),
    payment_id = COALESCE(p_payment_id, payment_id),
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{gateway_payment_id}',
      to_jsonb(p_gateway_payment_id)
    )
  WHERE id = p_invoice_id;
  
  IF v_invoice.subscription_id IS NOT NULL THEN
    SELECT * INTO v_subscription
    FROM public.subscriptions
    WHERE id = v_invoice.subscription_id;
    
    IF FOUND THEN
      SELECT * INTO v_plan
      FROM public.plans
      WHERE id = v_subscription.plan_id;
      
      v_new_expiry_date := CASE
        WHEN v_subscription.expires_at > now() THEN v_subscription.expires_at
        ELSE now()
      END + CASE v_plan.billing_period
        WHEN 'monthly' THEN INTERVAL '1 month'
        WHEN 'quarterly' THEN INTERVAL '3 months'
        WHEN 'semiannual' THEN INTERVAL '6 months'
        WHEN 'annual' THEN INTERVAL '1 year'
        ELSE INTERVAL '1 month'
      END;
      
      UPDATE public.subscriptions
      SET 
        status = 'active',
        expires_at = v_new_expiry_date,
        updated_at = now()
      WHERE id = v_subscription.id;
      
      UPDATE public.tenants
      SET 
        subscription_status = 'active',
        expiry_date = v_new_expiry_date,
        updated_at = now()
      WHERE id = v_invoice.tenant_id;
    END IF;
  END IF;
  
  INSERT INTO public.invoice_notifications (
    invoice_id,
    tenant_id,
    notification_type,
    delivery_method,
    status
  ) VALUES (
    p_invoice_id,
    v_invoice.tenant_id,
    'payment_received',
    'internal_message',
    'sent'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Pagamento processado com sucesso',
    'new_expiry_date', v_new_expiry_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_due_invoices()
RETURNS void AS $$
DECLARE
  v_invoice RECORD;
BEGIN
  FOR v_invoice IN
    SELECT i.*, t.name as tenant_name
    FROM public.invoices i
    JOIN public.tenants t ON t.id = i.tenant_id
    WHERE i.status IN ('pending', 'overdue')
      AND i.due_date BETWEEN now() AND now() + INTERVAL '3 days'
      AND NOT EXISTS (
        SELECT 1 FROM public.invoice_notifications
        WHERE invoice_id = i.id 
          AND notification_type = 'due_soon'
          AND created_at > now() - INTERVAL '1 day'
      )
  LOOP
    INSERT INTO public.invoice_notifications (
      invoice_id,
      tenant_id,
      notification_type,
      delivery_method,
      status
    ) VALUES (
      v_invoice.id,
      v_invoice.tenant_id,
      'due_soon',
      'internal_message',
      'sent'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;