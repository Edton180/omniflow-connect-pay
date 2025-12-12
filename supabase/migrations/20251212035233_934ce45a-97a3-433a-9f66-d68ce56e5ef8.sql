-- Corrigir funções com search_path mutável

-- Corrigir ensure_webhook_idempotency (versão antiga)
CREATE OR REPLACE FUNCTION public.ensure_webhook_idempotency(p_gateway text, p_event_id text, p_payload jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_existing_log RECORD;
BEGIN
  SELECT * INTO v_existing_log
  FROM public.webhook_logs
  WHERE gateway = p_gateway 
    AND event_id = p_event_id
    AND status = 'success';

  IF FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.webhook_logs (gateway, event_type, event_id, payload, status)
  VALUES (p_gateway, p_payload->>'type', p_event_id, p_payload, 'processing')
  ON CONFLICT DO NOTHING;

  RETURN TRUE;
END;
$function$;

-- Corrigir mark_webhook_processed
CREATE OR REPLACE FUNCTION public.mark_webhook_processed(p_gateway text, p_event_id text, p_success boolean, p_error_message text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.webhook_logs
  SET 
    status = CASE WHEN p_success THEN 'success' ELSE 'failed' END,
    error_message = p_error_message,
    processed_at = NOW(),
    retry_count = retry_count + 1,
    last_retry_at = NOW()
  WHERE gateway = p_gateway AND event_id = p_event_id;
END;
$function$;