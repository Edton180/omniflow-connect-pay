# Guia de Configuração de Webhooks - OmniFlow

Este guia detalha como configurar webhooks para todos os gateways de pagamento suportados.

## Índice
- [Stripe](#stripe)
- [Mercado Pago](#mercado-pago)
- [ASAAS](#asaas)
- [InfinitePay](#infinitepay)
- [Secrets Necessários](#secrets-necessários)

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

## Secrets Necessários

### Supabase Secrets (já configurados)
```bash
SUPABASE_URL=https://yfseeexwafzmezufwdxq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY={service_role_key}
```

### Evolution API (para WhatsApp)
```bash
EVOLUTION_API_URL=https://seu-evolution.com
EVOLUTION_API_KEY=sua_api_key
```

### Telegram
```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
```

### Payment Gateways
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

### Webhook não recebe eventos

1. **Verifique a URL**: Deve estar acessível publicamente
2. **Verifique secrets**: Todos configurados corretamente?
3. **Veja logs**: Erros de validação aparecem no log da function
4. **Teste manualmente**:
```bash
curl -X POST https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/stripe-webhook \
  -H "stripe-signature: xxx" \
  -d '{"test": true}'
```

### Assinatura inválida

1. **Secret errado**: Verifique se copiou corretamente
2. **Encoding**: Payload deve ser raw (não parsed)
3. **Headers**: Verifique nome exato do header

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
