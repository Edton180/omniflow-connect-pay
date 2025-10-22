# Guia Completo de Configuração de Webhooks

Este guia detalha como configurar webhooks para todos os canais de comunicação e gateways de pagamento.

## Índice
- [URLs dos Webhooks](#urls-dos-webhooks)
- [Canais de Comunicação](#canais-de-comunicação)
  - [Telegram](#telegram)
  - [WhatsApp Business API (WABA)](#whatsapp-business-api-waba)
  - [Facebook Messenger](#facebook-messenger)
  - [Instagram](#instagram)
  - [Evolution API](#evolution-api)
- [Gateways de Pagamento](#gateways-de-pagamento)
  - [Stripe](#stripe)
  - [Mercado Pago](#mercado-pago)
  - [ASAAS](#asaas)
  - [InfinitePay](#infinitepay)
- [Configuração Automática de Faturas](#configuração-automática-de-faturas)
- [Secrets Necessários](#secrets-necessários)
- [Troubleshooting](#troubleshooting)

---

## URLs dos Webhooks

**Base URL**: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/`

### Canais de Comunicação

| Canal | URL do Webhook |
|-------|----------------|
| Telegram | `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/telegram-webhook` |
| WhatsApp Business (WABA) | `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/waba-webhook` |
| Facebook Messenger | `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/facebook-webhook` |
| Instagram | `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/facebook-webhook` |

### Gateways de Pagamento

| Gateway | URL do Webhook |
|---------|----------------|
| Stripe | `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/stripe-webhook` |
| Mercado Pago | `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/mercadopago-webhook` |
| ASAAS | `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/asaas-webhook` |
| InfinitePay | `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/infinitepay-webhook` |

---

## Canais de Comunicação

### Telegram

#### 1. Criar o Bot
1. Abra o Telegram e procure por `@BotFather`
2. Envie o comando `/newbot`
3. Siga as instruções para criar seu bot
4. Guarde o **Token do Bot** fornecido (formato: `1234567890:ABCDEF...`)

#### 2. Configurar o Webhook
Execute este comando substituindo `YOUR_BOT_TOKEN` pelo token do seu bot:

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/telegram-webhook"
  }'
```

#### 3. Verificar o Webhook
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

Você deve ver a URL do webhook configurada e `pending_update_count: 0`.

#### 4. Configurar no Sistema
1. Acesse a página de **Canais** no sistema
2. Clique em **Adicionar Canal**
3. Selecione **Telegram**
4. Cole o **Token do Bot**
5. Adicione uma mensagem de saudação (opcional)
6. Clique em **Salvar**

#### 5. Testar
1. Abra seu bot no Telegram
2. Envie uma mensagem
3. A mensagem deve aparecer no sistema como um novo ticket

---

### WhatsApp Business API (WABA)

#### 1. Obter Credenciais
1. Acesse [Facebook for Developers](https://developers.facebook.com/)
2. Crie um App de **WhatsApp Business**
3. Obtenha:
   - **Phone Number ID** (ID do número de telefone)
   - **Access Token** (Token de acesso permanente)
   - **Verify Token** (crie um token aleatório seguro, ex: `waba_verify_abc123`)

#### 2. Configurar o Webhook no Meta
1. No painel do Facebook for Developers
2. Vá em **WhatsApp → Configuration**
3. Em "Webhook", clique em **Edit**
4. Configure:
   - **Callback URL**: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/waba-webhook`
   - **Verify Token**: Use o token que você criou (ex: `waba_verify_abc123`)
5. Clique em **Verify and Save**
6. Inscreva-se no evento: `messages`

#### 3. Configurar no Banco de Dados
Execute esta query no banco de dados:

```sql
INSERT INTO channel_configs (config_type, is_active, config)
VALUES ('waba', true, '{
  "phone_number_id": "SEU_PHONE_NUMBER_ID",
  "access_token": "SEU_ACCESS_TOKEN",
  "verify_token": "SEU_VERIFY_TOKEN"
}');
```

#### 4. Adicionar Canal no Sistema
1. Acesse **Canais**
2. Adicione um canal do tipo **WhatsApp Business**
3. Configure conforme necessário

---

### Facebook Messenger

#### 1. Configurar a Página
1. Acesse [Facebook for Developers](https://developers.facebook.com/)
2. Crie um App de **Messenger**
3. Conecte uma **Página do Facebook**
4. Obtenha o **Page Access Token**
5. Crie um **Verify Token** (ex: `fb_verify_xyz789`)

#### 2. Configurar o Webhook no Meta
1. Em **Messenger → Settings → Webhooks**
2. Clique em **Add Callback URL**
3. Configure:
   - **Callback URL**: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/facebook-webhook`
   - **Verify Token**: Use o token que você criou
4. Inscreva-se nos eventos:
   - `messages`
   - `messaging_postbacks`

#### 3. Configurar no Banco de Dados
```sql
INSERT INTO channel_configs (config_type, is_active, config)
VALUES ('facebook', true, '{
  "page_access_token": "SEU_PAGE_ACCESS_TOKEN",
  "verify_token": "SEU_VERIFY_TOKEN"
}');
```

---

### Instagram

#### 1. Conectar Instagram
1. No mesmo App do Facebook
2. Adicione o produto **Instagram**
3. Conecte sua conta **profissional** do Instagram
4. Obtenha o **Page Access Token** (pode ser o mesmo do Facebook)

#### 2. Configurar o Webhook
1. Use o mesmo webhook do Facebook
2. Inscreva-se nos eventos: `messages`

#### 3. Configurar no Banco de Dados
```sql
INSERT INTO channel_configs (config_type, is_active, config)
VALUES ('instagram', true, '{
  "page_access_token": "SEU_PAGE_ACCESS_TOKEN",
  "verify_token": "SEU_VERIFY_TOKEN"
}');
```

---

### Evolution API

A Evolution API é uma solução de terceiros para WhatsApp. Configure conforme a documentação do seu provedor.

**URL do Webhook**: Configure a instância da Evolution API para enviar eventos para:
`https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/evolution-whatsapp`

---

## Gateways de Pagamento

---

## Stripe

### 1. Configurar Secret do Webhook

No Supabase/Lovable Cloud, adicione os seguintes secrets:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 2. Registrar Webhook no Stripe Dashboard

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em **"Add endpoint"**
3. Configure:
   - **Endpoint URL**: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/stripe-webhook`
   - **Events to send**:
     - `checkout.session.completed`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
4. Copie o **Signing secret** (formato: `whsec_...`)
5. Adicione como `STRIPE_WEBHOOK_SECRET` no Supabase

### 3. Testar Webhook

```bash
stripe trigger checkout.session.completed
```

---

## Mercado Pago

### 1. Configurar Secrets

```bash
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxx
```

### 2. Registrar Webhook no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/webhooks
2. Clique em **"Criar webhook"**
3. Configure:
   - **URL**: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/mercadopago-webhook`
   - **Eventos**:
     - `payment` (todos os eventos de pagamento)
4. Copie o **Secret** gerado
5. Adicione como `MERCADOPAGO_WEBHOOK_SECRET`

### 3. Validação de Assinatura

O webhook valida usando HMAC SHA-256:
```
Manifest: id:{request_id};request-id:{request_id};ts:{timestamp};
Data: manifest + payload
Signature: HMAC-SHA256(data, secret)
```

### 4. Testar Webhook

Use o simulador do Mercado Pago:
```bash
curl -X POST https://api.mercadopago.com/v1/payments/{payment_id}/test \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## ASAAS

### 1. Configurar Secret

```bash
ASAAS_WEBHOOK_TOKEN=seu_webhook_token_unico
```

**IMPORTANTE**: Crie um token único e seguro (ex: UUID v4)

### 2. Registrar Webhook no ASAAS

1. Acesse: https://www.asaas.com/config/webhooks
2. Configure:
   - **URL**: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/asaas-webhook`
   - **Token**: Cole o mesmo valor de `ASAAS_WEBHOOK_TOKEN`
   - **Eventos**:
     - `PAYMENT_RECEIVED`
     - `PAYMENT_CONFIRMED`
     - `PAYMENT_OVERDUE`
     - `PAYMENT_DELETED`

### 3. Validação

ASAAS envia o header: `asaas-access-token: {seu_token}`

O webhook valida comparando diretamente com `ASAAS_WEBHOOK_TOKEN`.

### 4. Metadata

Adicione metadata ao criar cobrança:
```json
{
  "externalReference": "{\"tenant_id\":\"xxx\",\"invoice_id\":\"yyy\"}"
}
```

---

## InfinitePay

### 1. Configurar Secret

```bash
INFINITEPAY_WEBHOOK_SECRET=seu_webhook_secret
```

### 2. Registrar Webhook no InfinitePay

1. Acesse o dashboard InfinitePay
2. Vá em **Configurações → Webhooks**
3. Configure:
   - **URL**: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/infinitepay-webhook`
   - **Eventos**:
     - `charge.paid`
     - `charge.approved`
     - `charge.failed`
     - `charge.cancelled`
4. Copie o **Webhook Secret**
5. Adicione como `INFINITEPAY_WEBHOOK_SECRET`

### 3. Validação de Assinatura

```
Signature = HMAC-SHA256(payload, webhook_secret)
Header: x-signature: {signature}
```

### 4. Metadata

Adicione metadata ao criar cobrança:
```json
{
  "metadata": {
    "tenant_id": "xxx",
    "invoice_id": "yyy",
    "order_id": "zzz"
  }
}
```

---

---

## Configuração Automática de Faturas

O sistema possui uma edge function que verifica assinaturas expiradas e gera faturas automaticamente.

### Configurar Cron Job no Supabase

Execute estas queries no banco de dados para criar o cron job:

```sql
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para verificar assinaturas expiradas diariamente às 00:00
SELECT cron.schedule(
  'check-expired-subscriptions-daily',
  '0 0 * * *', -- Todo dia à meia-noite
  $$
  SELECT
    net.http_post(
        url:='https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/check-expired-subscriptions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmc2VlZXh3YWZ6bWV6dWZ3ZHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTk2OTIsImV4cCI6MjA3NTQzNTY5Mn0.JGLZs1_NyLyurkJWLd6DnwYEXMQ7ZZ6qWpl9uB9Pz_4"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
```

### Verificar se o Cron Job está Ativo

```sql
SELECT * FROM cron.job WHERE jobname = 'check-expired-subscriptions-daily';
```

### Testar Manualmente

Você pode executar a verificação manualmente:

```bash
curl -X POST "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/check-expired-subscriptions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmc2VlZXh3YWZ6bWV6dWZ3ZHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTk2OTIsImV4cCI6MjA3NTQzNTY5Mn0.JGLZs1_NyLyurkJWLd6DnwYEXMQ7ZZ6qWpl9uB9Pz_4"
```

---

## Secrets Necessários

### Supabase (já configurados automaticamente)
```bash
SUPABASE_URL=https://yfseeexwafzmezufwdxq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY={gerenciado_automaticamente}
```

### Evolution API (opcional, se usar)
```bash
EVOLUTION_API_URL=https://seu-evolution.com
EVOLUTION_API_KEY=sua_api_key
```

### Gateways de Pagamento (adicionar conforme necessário)
```bash
# Stripe
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Mercado Pago
MERCADOPAGO_WEBHOOK_SECRET=seu_secret
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxx

# ASAAS
ASAAS_WEBHOOK_TOKEN=token_unico_gerado

# InfinitePay
INFINITEPAY_WEBHOOK_SECRET=seu_secret
```

**Nota**: Credenciais de canais (Telegram, WABA, Facebook, Instagram) são armazenadas na tabela `channel_configs`, não como secrets.

---

## Como Adicionar Secrets no Lovable Cloud

1. Abra o projeto no Lovable
2. Clique em **Backend** (ícone de banco de dados)
3. Vá em **Secrets**
4. Clique em **+ Add Secret**
5. Nome: `STRIPE_WEBHOOK_SECRET` (por exemplo)
6. Valor: cole o secret obtido do gateway
7. Clique em **Save**

Repita para cada secret necessário.

---

## Testando Webhooks Localmente

### Usando Ngrok (recomendado para desenvolvimento)

```bash
# Instalar ngrok
npm i -g ngrok

# Expor porta local
ngrok http 54321

# URL gerada: https://xxxx-xx-xxx.ngrok.io

# Usar URL nos webhooks:
https://xxxx-xx-xxx.ngrok.io/functions/v1/stripe-webhook
```

### Logs de Debug

Todos os webhooks logam no console do Supabase:

1. Acesse **Lovable → Backend → Edge Functions**
2. Selecione a function (ex: `stripe-webhook`)
3. Veja os logs em tempo real

---

## Troubleshooting

### Canais - Mensagens não chegam ao sistema

#### 1. Telegram
```bash
# Verificar se webhook está configurado
curl "https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo"

# Deve mostrar:
# - url: "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/telegram-webhook"
# - pending_update_count: 0
# - last_error_date: (não deve existir)

# Se o webhook não estiver configurado, configure:
curl -X POST "https://api.telegram.org/botYOUR_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/telegram-webhook"}'
```

**Checklist**:
- [ ] Bot token correto no banco de dados
- [ ] Webhook configurado no Telegram
- [ ] Canal ativo no sistema (status = 'active')
- [ ] Canal associado a um tenant_id

#### 2. WhatsApp Business (WABA)
```bash
# Testar se webhook responde à verificação
curl "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/waba-webhook?hub.mode=subscribe&hub.verify_token=SEU_VERIFY_TOKEN&hub.challenge=test123"

# Deve retornar: test123
```

**Checklist**:
- [ ] Phone Number ID correto
- [ ] Access Token válido e com permissões
- [ ] Verify Token configurado corretamente no Meta e no banco
- [ ] Webhook inscrito no evento `messages` no Meta
- [ ] Configuração ativa em `channel_configs`

#### 3. Facebook/Instagram
```bash
# Testar verificação do webhook
curl "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/facebook-webhook?hub.mode=subscribe&hub.verify_token=SEU_VERIFY_TOKEN&hub.challenge=test123"
```

**Checklist**:
- [ ] Page Access Token válido
- [ ] Verify Token correto
- [ ] Webhook inscrito nos eventos corretos
- [ ] Página conectada ao app
- [ ] Permissões de mensagens concedidas

### Canais - Não consegue enviar mensagens

#### Telegram
```bash
# Testar envio direto
curl -X POST "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/send-telegram-message" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "chatId": "SEU_CHAT_ID",
    "message": "Teste",
    "botToken": "SEU_BOT_TOKEN"
  }'
```

**Como obter o Chat ID**:
1. Envie uma mensagem para seu bot
2. Acesse: `https://api.telegram.org/botYOUR_TOKEN/getUpdates`
3. Procure por `"chat":{"id":123456789}`

#### WhatsApp (WABA)
```bash
curl -X POST "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/send-waba-message" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "to": "5511999999999",
    "message": "Teste",
    "phoneNumberId": "SEU_PHONE_NUMBER_ID",
    "accessToken": "SEU_ACCESS_TOKEN"
  }'
```

### Pagamentos - Webhook não recebe eventos

1. **Verifique a URL**: Deve estar acessível publicamente
2. **Verifique secrets**: Todos configurados corretamente?
3. **Veja logs**: Acesse Backend → Edge Functions → selecione a função
4. **Teste manualmente**:
```bash
curl -X POST https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/stripe-webhook \
  -H "stripe-signature: xxx" \
  -d '{"test": true}'
```

### Pagamentos - Assinatura inválida

1. **Secret errado**: Verifique se copiou corretamente do dashboard do gateway
2. **Encoding**: Payload deve ser raw (não parsed)
3. **Headers**: Verifique nome exato do header (varia por gateway)

### Faturas - Não são geradas automaticamente

#### Verificar Assinaturas Expiradas
```sql
-- Ver assinaturas que deveriam gerar faturas
SELECT 
  s.id,
  s.tenant_id,
  s.status,
  s.expires_at,
  p.name as plan_name,
  p.price,
  t.name as tenant_name
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
JOIN tenants t ON s.tenant_id = t.id
WHERE s.status = 'active' 
  AND s.expires_at < NOW();
```

#### Verificar Cron Job
```sql
-- Ver se cron job existe
SELECT * FROM cron.job 
WHERE jobname = 'check-expired-subscriptions-daily';

-- Se não existir, criar conforme seção "Configuração Automática de Faturas"
```

#### Executar Manualmente
```bash
curl -X POST "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/check-expired-subscriptions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmc2VlZXh3YWZ6bWV6dWZ3ZHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTk2OTIsImV4cCI6MjA3NTQzNTY5Mn0.JGLZs1_NyLyurkJWLd6DnwYEXMQ7ZZ6qWpl9uB9Pz_4"
```

#### Verificar Logs da Função
```sql
-- Logs recentes da função check-expired-subscriptions
-- Acesse: Backend → Edge Functions → check-expired-subscriptions → Logs
```

### Super Admin - Não vê faturas

#### Verificar RLS Policies
```sql
-- Super admin deve ter acesso a todas as faturas
SELECT * FROM invoices LIMIT 5;

-- Se não retornar, verificar role:
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- Deve ter role = 'super_admin'
```

#### Criar Fatura de Teste
```sql
-- Criar fatura manualmente para teste
INSERT INTO invoices (
  tenant_id,
  amount,
  currency,
  status,
  due_date,
  description
) VALUES (
  (SELECT id FROM tenants LIMIT 1),
  100.00,
  'BRL',
  'pending',
  NOW() + INTERVAL '30 days',
  'Fatura de teste'
);
```

### Verificar Logs em Tempo Real

1. Acesse o Backend (ícone de banco de dados no Lovable)
2. Vá em **Edge Functions**
3. Selecione a função que quer monitorar
4. Veja os logs em tempo real enquanto testa

### Duplicação de eventos

- Webhooks implementam **idempotency check** via `gateway_payment_id`
- Se mesmo payment_id já existe, webhook ignora

---

## Segurança

### ✅ Implementado

- ✅ Validação de assinatura em todos os gateways
- ✅ Verificação de tokens/secrets
- ✅ Idempotency para evitar duplicação
- ✅ Logs detalhados para auditoria
- ✅ Uso de SERVICE_ROLE_KEY (não ANON_KEY)

### ⚠️ Importante

- **NUNCA** exponha secrets no código
- **SEMPRE** use HTTPS em produção
- **ROTACIONE** secrets periodicamente
- **MONITORE** logs de webhook para atividades suspeitas

---

## Suporte

- **Documentação Stripe**: https://stripe.com/docs/webhooks
- **Documentação Mercado Pago**: https://www.mercadopago.com.br/developers/pt/docs/webhooks
- **Documentação ASAAS**: https://docs.asaas.com/reference/webhooks
- **Documentação InfinitePay**: Contate suporte InfinitePay

Para dúvidas sobre implementação, abra uma issue no repositório.
