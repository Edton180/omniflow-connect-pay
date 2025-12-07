-- Função de auditoria melhorada
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_tenant_id uuid;
  v_old_data jsonb;
  v_new_data jsonb;
BEGIN
  -- Capturar user_id do contexto
  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  -- Determinar tenant_id
  IF TG_OP = 'DELETE' THEN
    v_tenant_id := CASE 
      WHEN TG_TABLE_NAME = 'tenants' THEN OLD.id
      ELSE OLD.tenant_id
    END;
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_tenant_id := CASE 
      WHEN TG_TABLE_NAME = 'tenants' THEN NEW.id
      ELSE NEW.tenant_id
    END;
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
  ELSE -- UPDATE
    v_tenant_id := CASE 
      WHEN TG_TABLE_NAME = 'tenants' THEN NEW.id
      ELSE NEW.tenant_id
    END;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  END IF;

  -- Inserir log
  INSERT INTO public.audit_logs (
    user_id,
    tenant_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    created_at
  ) VALUES (
    v_user_id,
    v_tenant_id,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_old_data,
    v_new_data,
    NOW()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Remover triggers existentes para recriar
DROP TRIGGER IF EXISTS audit_trigger_tickets ON public.tickets;
DROP TRIGGER IF EXISTS audit_trigger_contacts ON public.contacts;
DROP TRIGGER IF EXISTS audit_trigger_invoices ON public.invoices;
DROP TRIGGER IF EXISTS audit_trigger_payments ON public.payments;
DROP TRIGGER IF EXISTS audit_trigger_user_roles ON public.user_roles;
DROP TRIGGER IF EXISTS audit_trigger_tenants ON public.tenants;
DROP TRIGGER IF EXISTS audit_trigger_channels ON public.channels;

-- Criar triggers para tabelas principais
CREATE TRIGGER audit_trigger_tickets
  AFTER INSERT OR UPDATE OR DELETE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_trigger_contacts
  AFTER INSERT OR UPDATE OR DELETE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_trigger_invoices
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_trigger_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_trigger_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_trigger_tenants
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_trigger_channels
  AFTER INSERT OR UPDATE OR DELETE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();