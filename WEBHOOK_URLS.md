# URLs dos Webhooks - Configuração Rápida

## Base URL
```
https://yfseeexwafzmezufwdxq.supabase.co/functions/v1
```

## URLs Completas por Canal

### 1. Telegram
```
https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/telegram-webhook
```

**Configurar no Telegram:**
```bash
curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/telegram-webhook"}'
```

### 2. WhatsApp Business API (WABA - Oficial)
```
https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/waba-webhook
```

**Configurar no Meta for Developers:**
1. Acesse: https://developers.facebook.com/
2. WhatsApp → Configuration → Webhooks
3. Cole a URL acima
4. Campos: `messages`, `message_status`

### 3. Facebook Messenger e Instagram
```
https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/facebook-webhook
```

**Configurar no Meta for Developers:**
1. Acesse: https://developers.facebook.com/
2. Messenger → Settings → Webhooks
3. Cole a URL acima
4. Campos: `messages`, `messaging_postbacks`

### 4. Evolution API (WhatsApp Não-Oficial)
```
https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/evolution-whatsapp
```

**Configurar via API:**
```bash
curl -X POST "https://sua-evolution-api.com/webhook/set/INSTANCE_NAME" \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/evolution-whatsapp",
    "webhook_by_events": false
  }'
```

## Verificação dos Webhooks

### Verificar se o Telegram está recebendo:
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

### Verificar se o WABA está configurado:
```bash
curl "https://graph.facebook.com/v18.0/<PHONE_NUMBER_ID>/subscriptions" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Credenciais Necessárias

Configure antes de usar os webhooks em **Canais → Configurações de Canais**:

### Telegram
- ✅ Bot Token

### WABA
- ✅ Access Token
- ✅ Phone Number ID
- ✅ Verify Token

### Facebook/Instagram
- ✅ Page Access Token
- ✅ Page ID
- ✅ Instagram Account ID
- ✅ Verify Token

### Evolution API
- ✅ API URL
- ✅ API Key
- ✅ Instance Name

## Status dos Webhooks

Após configurar, teste enviando uma mensagem no canal. Verifique:
1. Se a mensagem aparece no painel de tickets
2. Se o contato foi criado automaticamente
3. Se o ticket foi aberto com sucesso

## Troubleshooting

**Webhook não recebe mensagens:**
- Verifique se a URL está correta
- Verifique se o canal está ativo no sistema
- Verifique se as credenciais estão configuradas
- Teste a URL diretamente (deve retornar status 200)

**Erro 403 Forbidden:**
- Verifique se o Verify Token está correto
- Para Meta (WABA/Facebook), o token deve ser idêntico

**Erro 500:**
- Verifique os logs do Supabase
- Verifique se as credenciais estão válidas
- Verifique se a tabela channel_configs tem os dados
