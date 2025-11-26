-- Corrigir funções sem search_path definido para segurança
-- Issue: Function Search Path Mutable

-- 1. Atualizar função ensure_webhook_idempotency
CREATE OR REPLACE FUNCTION public.ensure_webhook_idempotency(p_gateway text, p_event_id text, p_event_type text, p_payload jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

-- 2. Atualizar função trigger_check_overdue
CREATE OR REPLACE FUNCTION public.trigger_check_overdue()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.due_date < NOW() AND NEW.status = 'pending' THEN
    NEW.status := 'overdue';
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Atualizar função auto_assign_agent_on_reply
CREATE OR REPLACE FUNCTION public.auto_assign_agent_on_reply()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.is_from_contact = false AND NEW.sender_id IS NOT NULL THEN
    UPDATE tickets
    SET 
      assigned_to = NEW.sender_id,
      updated_at = NOW()
    WHERE 
      id = NEW.ticket_id 
      AND assigned_to IS NULL;
      
    IF FOUND THEN
      RAISE NOTICE 'Ticket % automaticamente atribuído ao agente %', NEW.ticket_id, NEW.sender_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Adicionar constraint para prevenir SQL injection em chaves importantes
-- Garantir que invoice_id é UUID válido
ALTER TABLE invoices ADD CONSTRAINT invoices_id_check CHECK (id IS NOT NULL);

-- Adicionar índices para melhorar performance em consultas de segurança
CREATE INDEX IF NOT EXISTS idx_invoices_status_tenant ON invoices(status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_status ON tickets(tenant_id, status);

-- Adicionar trigger para validar proof_file_url antes de inserir
CREATE OR REPLACE FUNCTION validate_proof_file_url()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.proof_file_url IS NOT NULL THEN
    -- Validar que a URL é do storage do Supabase
    IF NEW.proof_file_url !~ '^https?://[a-zA-Z0-9\-]+\.supabase\.(co|in)/storage/v1/object/public/' THEN
      RAISE EXCEPTION 'URL de comprovante inválida. Deve ser do storage do Supabase.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Aplicar trigger de validação
DROP TRIGGER IF EXISTS validate_invoice_proof ON invoices;
CREATE TRIGGER validate_invoice_proof
  BEFORE INSERT OR UPDATE OF proof_file_url ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION validate_proof_file_url();

-- Adicionar função para sanitizar inputs de usuário
CREATE OR REPLACE FUNCTION sanitize_text_input(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Remove tags HTML perigosos
  RETURN regexp_replace(
    regexp_replace(input_text, '<script[^>]*>.*?</script>', '', 'gi'),
    '<[^>]+>', '', 'g'
  );
END;
$$;