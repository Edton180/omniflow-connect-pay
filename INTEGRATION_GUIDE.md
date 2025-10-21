# Guia Completo de Integração - OmniFlow

## 📋 Índice
- [APIs de Mensageria](#apis-de-mensageria)
- [APIs de Pagamento](#apis-de-pagamento)
- [Troubleshooting](#troubleshooting)
- [Checklist de Verificação](#checklist-de-verificação)

---

## 🔌 APIs de Mensageria (Canais)

### WhatsApp Business API (WABA) Oficial

**Documentação**: [Meta for Developers - WhatsApp](https://developers.facebook.com/docs/whatsapp)

**Configuração**:
1. **Token de Acesso**: Obtenha no Meta Business Manager
2. **Phone Number ID**: ID do número de telefone configurado
3. **Webhook URL**: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/waba-webhook`

**Verificação do Webhook**:
```bash
# Meta envia GET request para verificar
GET /waba-webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE

# Sua aplicação deve retornar o challenge
Response: CHALLENGE (plain text)
```

**Eventos Recebidos** (POST):
- `messages` - Mensagem recebida
- `messages.status` - Status de envio

**Problemas Comuns**:
- ❌ URL não acessível publicamente
- ❌ Webhook não responde em < 5 segundos
- ❌ Token de verificação incorreto
- ❌ Certificado SSL inválido

---

### Facebook Messenger & Instagram

**Documentação**: 
- [Messenger API](https://developers.facebook.com/docs/messenger-platform)
- [Instagram API](https://developers.facebook.com/docs/instagram-api)

**Configuração**:
1. **Page Access Token**: Token da página com permissão `pages_messaging`
2. **App Secret**: Para validar assinatura do webhook
3. **Webhook URL**: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/facebook-webhook`

**Validação de Assinatura**:
```javascript
const signature = req.headers['x-hub-signature-256'];
const expectedSignature = crypto
  .createHmac('sha256', APP_SECRET)
  .update(rawBody)
  .digest('hex');

if (signature !== `sha256=${expectedSignature}`) {
  throw new Error('Invalid signature');
}
```

**Eventos Importantes**:
- `messages` - Mensagem recebida
- `messaging_postbacks` - Botão clicado
- `message_reads` - Mensagem lida

**Problemas Comuns**:
- ❌ Assinatura inválida (secret errado)
- ❌ Permissões da página incorretas
- ❌ Token expirado ou sem renovação

---

### Telegram Bot API

**Documentação**: [Telegram Bot API](https://core.telegram.org/bots/api)

**Configuração**:
1. **Bot Token**: Obtenha com [@BotFather](https://t.me/botfather)
2. **Webhook URL**: Configure via `setWebhook`

```bash
# Configurar webhook
POST https://api.telegram.org/bot<TOKEN>/setWebhook
{
  "url": "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/telegram-webhook",
  "allowed_updates": ["message", "callback_query"],
  "drop_pending_updates": true
}

# Verificar webhook
GET https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

**Estrutura de Mensagem**:
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 987654321,
      "first_name": "João",
      "username": "joao123"
    },
    "chat": {
      "id": 987654321,
      "type": "private"
    },
    "text": "Olá!"
  }
}
```

**Problemas Comuns**:
- ❌ Webhook não configurado (usando polling)
- ❌ URL não é HTTPS
- ❌ Certificate chain inválido
- ❌ Timeout ao responder

---

### Evolution API (WhatsApp Multi-Device)

**Documentação**: Fornecida pelo seu provedor

**Configuração**:
1. **API Key**: Chave de autenticação da instância
2. **Instance Name**: Nome da instância criada
3. **Webhook URL**: Configure nas settings da instância

**Endpoints Importantes**:
```bash
# Criar instância
POST /instance/create
{
  "instanceName": "omniflow-instance",
  "qrcode": true,
  "webhook": {
    "url": "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/evolution-whatsapp",
    "events": ["messages.upsert", "connection.update"]
  }
}

# Verificar status
GET /instance/connectionState/{instanceName}

# Enviar mensagem
POST /message/sendText/{instanceName}
{
  "number": "5511999999999",
  "text": "Olá!"
}
```

**Problemas Comuns**:
- ❌ QR Code não escaneado
- ❌ Instância desconectada
- ❌ API Key incorreta
- ❌ Webhook não configurado corretamente

---

### Baileys (Open-Source WhatsApp)

**Documentação**: [Baileys Wiki](https://github.com/WhiskeySockets/Baileys)

**Configuração**:
1. **Session Storage**: Salvar estado da sessão no banco
2. **QR Code**: Gerar e escanear para autenticação

**Implementação Crítica**:
```typescript
// Salvar estado da sessão
const saveCreds = async () => {
  await supabase
    .from('baileys_sessions')
    .upsert({
      channel_id: channelId,
      session_data: JSON.stringify(state.creds),
      status: 'connected'
    });
};

// Restaurar sessão
const { auth, saveCreds } = await useMultiFileAuthState('session_id');
```

**Problemas Comuns**:
- ❌ Sessão não salva corretamente
- ❌ Quebra após atualização do WhatsApp
- ❌ Multi-device não configurado
- ❌ Falta de tratamento de desconexão

---

## 💳 APIs de Pagamento

### Stripe

**Documentação**: [Stripe Docs](https://stripe.com/docs)

**Secrets Necessários**:
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Webhook Configuration**:
```bash
# URL do Webhook
https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/stripe-webhook

# Eventos para assinar:
- checkout.session.completed
- invoice.payment_succeeded
- invoice.payment_failed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
```

**Validação de Webhook**:
```typescript
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  STRIPE_WEBHOOK_SECRET
);
```

**Fluxo de Assinatura**:
1. Cliente → Cria Checkout Session
2. Stripe → Processa pagamento
3. Webhook → `checkout.session.completed`
4. Backend → Ativa assinatura
5. Webhook → `invoice.payment_succeeded` (mensalmente)

---

### Mercado Pago

**Documentação**: [Mercado Pago Developers](https://www.mercadopago.com.br/developers)

**Secrets Necessários**:
```bash
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=your_secret
```

**Webhook Configuration**:
```bash
# URL do Webhook
https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/mercadopago-webhook

# Eventos:
- payment
```

**Validação HMAC**:
```typescript
const manifest = `id:${id};request-id:${requestId};ts:${timestamp};`;
const data = manifest + JSON.stringify(payload);
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(data)
  .digest('hex');
```

**Metadata para Rastreio**:
```json
{
  "external_reference": "{\"tenant_id\":\"xxx\",\"invoice_id\":\"yyy\"}"
}
```

---

### ASAAS

**Documentação**: [ASAAS API](https://docs.asaas.com)

**Secrets Necessários**:
```bash
ASAAS_API_KEY=$aact_...
ASAAS_WEBHOOK_TOKEN=unique_token_here
```

**Webhook Configuration**:
```bash
# URL do Webhook
https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/asaas-webhook

# Eventos:
- PAYMENT_RECEIVED
- PAYMENT_CONFIRMED
- PAYMENT_OVERDUE
- PAYMENT_DELETED
```

**Validação**:
```typescript
const token = req.headers['asaas-access-token'];
if (token !== ASAAS_WEBHOOK_TOKEN) {
  throw new Error('Invalid token');
}
```

**Criar Assinatura**:
```bash
POST https://api.asaas.com/v3/subscriptions
{
  "customer": "cus_xxx",
  "billingType": "CREDIT_CARD",
  "cycle": "MONTHLY",
  "value": 99.90,
  "externalReference": "{\"tenant_id\":\"xxx\"}"
}
```

---

### InfinitePay

**Documentação**: [InfinitePay Docs](https://developers.infinitepay.io)

**Secrets Necessários**:
```bash
INFINITEPAY_API_KEY=...
INFINITEPAY_WEBHOOK_SECRET=...
```

**Webhook Configuration**:
```bash
# URL do Webhook
https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/infinitepay-webhook

# Eventos:
- charge.paid
- charge.approved
- charge.failed
- charge.cancelled
```

**Validação**:
```typescript
const signature = req.headers['x-signature'];
const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');
```

---

## 🔍 Troubleshooting

### Checklist de Verificação

#### Webhooks Não Funcionam

**1. URL Acessível?**
```bash
# Testar URL externamente
curl -X POST https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/telegram-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Deve retornar 200 OK ou 204 No Content
```

**2. HTTPS Válido?**
```bash
# Verificar certificado SSL
openssl s_client -connect yfseeexwafzmezufwdxq.supabase.co:443 -servername yfseeexwafzmezufwdxq.supabase.co

# Verificar cadeia completa
curl -vI https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/telegram-webhook
```

**3. Tempo de Resposta < 5s?**
```typescript
// ✅ CORRETO: Retornar rapidamente
export default async (req: Request) => {
  const data = await req.json();
  
  // Processar de forma assíncrona
  processWebhookAsync(data); // Não await!
  
  // Retornar imediatamente
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

**4. Logs Disponíveis?**
- Acesse Lovable → Backend → Edge Functions
- Selecione a function (ex: `telegram-webhook`)
- Veja logs em tempo real

---

#### Mensagens Não Chegam

**1. Canal Conectado?**
```sql
-- Verificar status dos canais
SELECT id, name, type, status, config 
FROM channels 
WHERE tenant_id = 'YOUR_TENANT_ID';

-- Status deve ser 'active'
```

**2. Webhook Configurado?**
```bash
# Telegram
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Evolution API
curl https://your-evolution.com/instance/webhook/{instanceName} \
  -H "apikey: YOUR_KEY"
```

**3. Contato Criado?**
```sql
-- Verificar se contato foi criado
SELECT * FROM contacts 
WHERE phone = '+5511999999999' 
OR metadata->>'telegram_chat_id' = '123456789';
```

**4. Ticket Criado?**
```sql
-- Verificar tickets recentes
SELECT t.*, c.name, c.phone 
FROM tickets t
JOIN contacts c ON t.contact_id = c.id
ORDER BY t.created_at DESC
LIMIT 10;
```

---

#### Pagamentos Não Processam

**1. Webhook Recebendo Eventos?**
```sql
-- Verificar logs da edge function
-- Lovable → Backend → Edge Functions → stripe-webhook
```

**2. Assinatura Válida?**
```bash
# Stripe
curl https://api.stripe.com/v1/subscriptions/sub_xxx \
  -u sk_live_...:

# Mercado Pago
curl https://api.mercadopago.com/preapproval/PLAN_ID \
  -H "Authorization: Bearer APP_USR-..."
```

**3. Invoice Criada?**
```sql
-- Verificar faturas
SELECT * FROM invoices 
WHERE tenant_id = 'YOUR_TENANT_ID' 
ORDER BY created_at DESC;
```

**4. Metadata Correta?**
```json
// Ao criar pagamento, incluir:
{
  "metadata": {
    "tenant_id": "uuid-here",
    "invoice_id": "uuid-here",
    "subscription_id": "uuid-here"
  }
}
```

---

#### Assinaturas Não Renovam

**1. Cron Job Ativo?**
```sql
-- Verificar se cron está configurado
SELECT * FROM cron.job;

-- Deve existir job para check-expired-subscriptions
```

**2. Fatura Gerada Automaticamente?**
```sql
-- Verificar se função está rodando
SELECT * FROM invoices 
WHERE created_at > NOW() - INTERVAL '24 hours'
AND metadata->>'auto_generated' = 'true';
```

**3. Gateway Configurado?**
```sql
-- Verificar se tenant tem gateway ativo
SELECT * FROM payment_gateways 
WHERE tenant_id = 'YOUR_TENANT_ID' 
AND is_active = true;
```

**4. Edge Function Rodando?**
```bash
# Verificar logs
# Lovable → Backend → Edge Functions → check-expired-subscriptions
```

---

## ✅ Checklist Final

### Para Cada Canal

- [ ] Token/API Key configurado corretamente
- [ ] Webhook URL configurada na plataforma
- [ ] Webhook retorna 200 OK em < 5s
- [ ] HTTPS válido e acessível
- [ ] Logs mostram eventos sendo recebidos
- [ ] Contatos sendo criados automaticamente
- [ ] Tickets sendo criados automaticamente
- [ ] Mensagens aparecendo no sistema

### Para Cada Gateway de Pagamento

- [ ] API Key e Webhook Secret configurados
- [ ] Webhook URL registrada no gateway
- [ ] Validação de assinatura funcionando
- [ ] Logs mostram eventos sendo recebidos
- [ ] Invoices sendo criadas
- [ ] Pagamentos sendo registrados
- [ ] Assinaturas sendo ativadas/renovadas
- [ ] Status do tenant sendo atualizado

### Geral

- [ ] Todos os secrets configurados no Supabase
- [ ] Cron job para expiração ativo
- [ ] RLS policies permitem operações
- [ ] Logs não mostram erros 500
- [ ] Testes manuais passando

---

## 🆘 Suporte

### Documentação Oficial

- **Stripe**: https://stripe.com/docs/webhooks
- **Mercado Pago**: https://www.mercadopago.com.br/developers/pt/docs/webhooks
- **ASAAS**: https://docs.asaas.com/reference/webhooks
- **Telegram**: https://core.telegram.org/bots/webhooks
- **WhatsApp**: https://developers.facebook.com/docs/whatsapp/webhooks

### Logs e Debug

```bash
# Ver logs em tempo real
# Lovable → Backend → Edge Functions → [nome-da-function]

# Testar webhook localmente com ngrok
ngrok http 54321
# Usar URL gerada nos webhooks para teste
```

### Testes Manuais

Use o **MessageTester** em `/channel-settings` para:
- Testar envio de mensagens
- Verificar conectividade
- Validar credenciais
- Confirmar webhook funcionando

---

**Última Atualização**: 2025-10-21
