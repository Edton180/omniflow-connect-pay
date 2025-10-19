# Documentação de Integração de Canais de Comunicação

Esta documentação detalha como configurar e usar todos os canais de comunicação disponíveis no sistema.

## URLs dos Webhooks

Todos os webhooks estão disponíveis em:
- Base URL: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1`

### URLs Específicas por Canal:
- **Telegram**: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/telegram-webhook`
- **WABA (WhatsApp Business)**: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/waba-webhook`
- **Facebook/Instagram**: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/facebook-webhook`
- **Evolution API**: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/evolution-whatsapp`

## 1. Telegram Bot API

### Configuração Necessária:
1. **BOT_TOKEN**: Obtenha com @BotFather no Telegram usando `/newbot`
2. **WEBHOOK_URL**: Use o URL acima

### Configuração no Sistema:
1. Acesse **Canais** → **Configurações de Canais**
2. Seção **Telegram Bot**
3. Preencha:
   - **Bot Token**: Seu token do @BotFather
4. Ative o canal

### Configuração do Webhook:
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/telegram-webhook"}'
```

## 2. WABA - WhatsApp Business API (Oficial)

### Configuração Necessária:
1. **ACCESS_TOKEN**: Token de longa duração da Meta Business
2. **PHONE_NUMBER_ID**: ID do número do WhatsApp Business
3. **VERIFY_TOKEN**: Token secreto definido por você

### Configuração no Sistema:
1. Acesse **Canais** → **Configurações de Canais**
2. Seção **WhatsApp Business API (Oficial)**
3. Preencha:
   - **Access Token**: System User Token ou Page Access Token
   - **Phone Number ID**: ID do número do WhatsApp Business
   - **Verify Token**: Sua chave secreta (defina uma senha forte)
4. Ative o canal

### Configuração no Meta Business:
1. Acesse o [Meta for Developers](https://developers.facebook.com/)
2. Vá em **WhatsApp** → **Configuration**
3. Em **Webhooks**, clique em **Edit**
4. Cole a URL: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/waba-webhook`
5. Digite o **Verify Token** que você definiu no sistema
6. Selecione os campos: `messages`, `message_status`

## 3. Facebook Messenger

### Configuração Necessária:
1. **PAGE_ACCESS_TOKEN**: Token de acesso à página
2. **PAGE_ID**: ID da página do Facebook
3. **VERIFY_TOKEN**: Token secreto definido por você

### Configuração no Sistema:
1. Acesse **Canais** → **Configurações de Canais**
2. Seção **Facebook Messenger**
3. Preencha:
   - **Page Access Token**: Token da sua página
   - **Page ID**: ID da página
   - **Verify Token**: Sua chave secreta
4. Ative o canal

### Configuração no Meta Business:
1. Acesse o [Meta for Developers](https://developers.facebook.com/)
2. Vá em **Messenger** → **Settings**
3. Em **Webhooks**, clique em **Add Callback URL**
4. Cole a URL: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/facebook-webhook`
5. Digite o **Verify Token** que você definiu
6. Selecione os campos: `messages`, `messaging_postbacks`

## 4. Instagram Messaging

### Configuração Necessária:
1. **INSTAGRAM_ACCOUNT_ID**: ID da conta profissional do Instagram
2. Usa o mesmo **PAGE_ACCESS_TOKEN** do Facebook

### Configuração no Sistema:
1. Acesse **Canais** → **Configurações de Canais**
2. Seção **Instagram Messaging**
3. Preencha:
   - **Instagram Account ID**: ID da conta profissional
4. Ative o canal

**Nota**: O Instagram usa o mesmo webhook do Facebook. Configure o webhook do Facebook primeiro.

## 5. Evolution API (WhatsApp Não-Oficial)

### Configuração Necessária:
1. **BASE_URL**: URL da sua instância Evolution
2. **API_KEY**: Chave de autenticação da Evolution
3. **INSTANCE_NAME**: Nome da instância

### Configuração no Sistema:
1. Acesse **Canais** → **Configurações de Canais**
2. Seção **Evolution API**
3. Preencha:
   - **URL da API**: URL da sua instância
   - **API Key**: Sua chave de autenticação
4. Ative o canal

### Criar Instância e Configurar Webhook:
```bash
# 1. Criar instância
curl -X POST "https://sua-evolution-api.com/instance/create" \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "producao-01"}'

# 2. Configurar webhook
curl -X POST "https://sua-evolution-api.com/webhook/set/producao-01" \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/evolution-whatsapp",
    "webhook_by_events": false
  }'

# 3. Obter QR Code
curl "https://sua-evolution-api.com/instance/connect/producao-01" \
  -H "apikey: SUA_API_KEY"
```

## 6. Baileys QR (WhatsApp Não-Oficial)

### Configuração:
1. Acesse **Canais** → **Novo Canal**
2. Selecione **WhatsApp (Baileys QR)**
3. Dê um nome ao canal
4. Salve e escaneie o QR Code que aparecerá

**Aviso**: Baileys e Evolution API são métodos não-oficiais e violam os Termos de Serviço do WhatsApp. Use por sua conta e risco.

## Fluxo de Funcionamento

### Recebimento de Mensagens:
1. Cliente envia mensagem no canal (WhatsApp, Telegram, etc.)
2. Webhook recebe a mensagem
3. Sistema busca ou cria o contato
4. Sistema busca ou cria um ticket aberto
5. Mensagem é salva no sistema
6. Atendente visualiza a mensagem no painel

### Envio de Mensagens:
1. Atendente escreve mensagem no painel
2. Sistema identifica o canal do ticket
3. Sistema busca as credenciais configuradas
4. Mensagem é enviada através da API específica

## Segurança

- Todas as credenciais são armazenadas criptografadas
- Verify tokens devem ser senhas fortes e únicas
- Recomenda-se usar System User Tokens para produção
- Nunca compartilhe suas chaves de API

## Troubleshooting

### Webhooks não estão recebendo mensagens:
1. Verifique se o canal está ativo no sistema
2. Verifique se as credenciais estão corretas
3. Teste a URL do webhook manualmente
4. Verifique os logs da plataforma (Meta, Telegram, etc.)

### Mensagens não estão sendo enviadas:
1. Verifique se as credenciais estão configuradas
2. Verifique os logs do sistema
3. Teste as credenciais diretamente na API

### Erros de autenticação:
1. Verifique se os tokens não expiraram
2. Para WABA/Facebook, use System User Tokens de longa duração
3. Renove os tokens se necessário

## Suporte

Para mais informações sobre cada API:
- **Telegram**: https://core.telegram.org/bots/api
- **WABA**: https://developers.facebook.com/docs/whatsapp
- **Facebook**: https://developers.facebook.com/docs/messenger-platform
- **Instagram**: https://developers.facebook.com/docs/instagram-api
- **Evolution API**: https://doc.evolution-api.com/
