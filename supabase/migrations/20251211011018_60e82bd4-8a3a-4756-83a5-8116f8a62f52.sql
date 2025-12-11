-- Corrigir functions sem search_path adequado
ALTER FUNCTION public.auto_create_crm_lead() SET search_path = public;
ALTER FUNCTION public.update_contact_last_seen() SET search_path = public;
ALTER FUNCTION public.trigger_check_subscription_expiry() SET search_path = public;
ALTER FUNCTION public.trigger_check_overdue() SET search_path = public;
ALTER FUNCTION public.auto_generate_invoice_on_expiry() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.auto_assign_tenant(uuid, text) SET search_path = public;
ALTER FUNCTION public.auto_assign_agent_on_reply() SET search_path = public;
ALTER FUNCTION public.update_agent_ticket_count() SET search_path = public;
ALTER FUNCTION public.log_audit() SET search_path = public;
ALTER FUNCTION public.update_telegram_webhook_on_domain_change() SET search_path = public;