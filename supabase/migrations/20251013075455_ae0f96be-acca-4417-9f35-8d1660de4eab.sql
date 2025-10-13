-- Criar função para atualizar webhook do Telegram automaticamente quando domínio mudar
CREATE OR REPLACE FUNCTION public.update_telegram_webhook_on_domain_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  channel_record RECORD;
  telegram_config JSONB;
  bot_token TEXT;
  webhook_url TEXT;
  telegram_response JSONB;
BEGIN
  -- Verificar se o custom_domain foi alterado
  IF OLD.custom_domain IS DISTINCT FROM NEW.custom_domain THEN
    -- Log da mudança
    RAISE NOTICE 'Domínio alterado de % para %', OLD.custom_domain, NEW.custom_domain;
    
    -- Buscar todos os canais Telegram deste tenant
    FOR channel_record IN 
      SELECT id, config, credentials_encrypted
      FROM channels
      WHERE tenant_id = NEW.id
      AND type = 'telegram'
      AND status = 'active'
    LOOP
      -- Extrair bot token do config
      telegram_config := channel_record.config;
      
      IF telegram_config ? 'bot_token' THEN
        bot_token := telegram_config->>'bot_token';
        
        -- Determinar URL do webhook baseado no novo domínio
        IF NEW.custom_domain IS NOT NULL AND NEW.custom_domain != '' THEN
          webhook_url := 'https://' || NEW.custom_domain || '/api/telegram-webhook';
        ELSE
          -- Usar URL padrão do Supabase
          webhook_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/telegram-webhook';
        END IF;
        
        RAISE NOTICE 'Atualizando webhook do Telegram para canal % com URL: %', channel_record.id, webhook_url;
        
        -- Armazenar a nova URL no config do canal
        UPDATE channels
        SET config = jsonb_set(
          COALESCE(config, '{}'::jsonb),
          '{webhook_url}',
          to_jsonb(webhook_url)
        )
        WHERE id = channel_record.id;
        
        -- Nota: A atualização real do webhook no Telegram deve ser feita via edge function
        -- pois requer chamada HTTP externa, que não é permitida diretamente em triggers
        
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função quando custom_domain for atualizado
DROP TRIGGER IF EXISTS trigger_update_telegram_webhook ON tenants;
CREATE TRIGGER trigger_update_telegram_webhook
  AFTER UPDATE OF custom_domain ON tenants
  FOR EACH ROW
  WHEN (OLD.custom_domain IS DISTINCT FROM NEW.custom_domain)
  EXECUTE FUNCTION public.update_telegram_webhook_on_domain_change();

-- Comentários para documentação
COMMENT ON FUNCTION public.update_telegram_webhook_on_domain_change() IS 
'Atualiza automaticamente a configuração do webhook do Telegram quando o domínio personalizado do tenant é alterado. Esta função prepara os dados, mas a atualização efetiva no Telegram deve ser feita via edge function.';