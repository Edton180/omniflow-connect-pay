# Guia de Troubleshooting - OmniFlow

## 🚨 Problemas Comuns e Soluções

### 1. Canal Não Conecta

#### Sintomas
- Status do canal permanece "inactive"
- QR Code não aparece ou não funciona
- Erro "Connection failed"

#### Diagnóstico Passo a Passo

**A. Verificar Configuração Básica**
```sql
-- 1. Verificar se canal existe e está configurado
SELECT 
  id, 
  name, 
  type, 
  status, 
  config,
  credentials_encrypted 
FROM channels 
WHERE tenant_id = 'SEU_TENANT_ID';
```

**Checklist**:
- [ ] `type` está correto? (telegram, waba, evolution, baileys)
- [ ] `config` contém as credenciais necessárias?
- [ ] `credentials_encrypted` está preenchido (se aplicável)?

**B. Verificar Channel Config**
```sql
SELECT 
  config_type,
  api_url,
  api_key_encrypted,
  config,
  is_active
FROM channel_configs
WHERE tenant_id = 'SEU_TENANT_ID'
AND config_type = 'telegram'; -- ou outro tipo
```

**Checklist**:
- [ ] `is_active = true`?
- [ ] `api_url` correto (para Evolution)?
- [ ] `api_key_encrypted` preenchido?

**C. Testar Conectividade da API**

*Para Telegram*:
```bash
# Testar bot token
curl https://api.telegram.org/bot<SEU_TOKEN>/getMe

# Resposta esperada:
{
  "ok": true,
  "result": {
    "id": 123456789,
    "is_bot": true,
    "first_name": "Bot Name",
    "username": "bot_username"
  }
}
```

*Para Evolution API*:
```bash
# Testar conexão
curl https://sua-evolution.com/instance/connectionState/instance-name \
  -H "apikey: SUA_API_KEY"

# Resposta esperada:
{
  "state": "open", # ou "close" se desconectado
  "statusReason": "connected"
}
```

*Para WABA*:
```bash
# Testar token
curl https://graph.facebook.com/v18.0/me \
  -H "Authorization: Bearer SEU_TOKEN"

# Resposta esperada:
{
  "id": "123456789012345",
  "name": "Business Name"
}
```

**D. Verificar Webhook**

```bash
# Telegram
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Resposta esperada:
{
  "ok": true,
  "result": {
    "url": "https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/telegram-webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_error_date": 0, # Se > 0, há erro!
    "last_error_message": "" # Ver mensagem de erro aqui
  }
}
```

**Soluções**:

1. **Token Inválido**: Recriar bot no BotFather (Telegram) ou gerar novo token
2. **Webhook com Erro**: Reconfigurar usando `/telegram-auto-webhook`
3. **API Desconectada**: Reconectar instância (Evolution) ou escanear QR Code (Baileys)

---

### 2. Mensagens Não Chegam

#### Sintomas
- Webhook recebe eventos mas mensagens não aparecem
- Contatos não são criados
- Tickets não são gerados

#### Diagnóstico Passo a Passo

**A. Verificar Logs da Edge Function**

1. Acesse: Lovable → Backend → Edge Functions
2. Selecione: `telegram-webhook` (ou outro)
3. Verifique erros nos logs recentes

**Erros Comuns**:
```
❌ "Failed to insert contact" → RLS bloqueando
❌ "Tenant not found" → tenant_id incorreto
❌ "Channel not found" → Canal desativado
```

**B. Testar Webhook Manualmente**

```bash
# Simular mensagem do Telegram
curl -X POST https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/telegram-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "message_id": 1,
      "from": {
        "id": 123456789,
        "first_name": "Teste",
        "username": "teste"
      },
      "chat": {
        "id": 123456789,
        "type": "private"
      },
      "text": "Mensagem de teste"
    }
  }'

# Resposta esperada:
{"ok": true}
```

**C. Verificar RLS Policies**

```sql
-- Testar se pode criar contato
INSERT INTO contacts (tenant_id, name, phone)
VALUES ('SEU_TENANT_ID', 'Teste', '+5511999999999');

-- Se erro "new row violates row-level security policy"
-- → RLS está bloqueando

-- Verificar policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('contacts', 'tickets', 'messages');
```

**D. Verificar se Contato Foi Criado**

```sql
-- Buscar contatos recentes
SELECT * FROM contacts 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Buscar por phone específico
SELECT * FROM contacts 
WHERE phone LIKE '%999999999%';

-- Buscar por metadata (Telegram)
SELECT * FROM contacts 
WHERE metadata->>'telegram_chat_id' = '123456789';
```

**Soluções**:

1. **RLS Bloqueando**: 
   - Verificar se usuário tem `tenant_id` correto
   - Adicionar policy para service role key

2. **Tenant ID Incorreto**:
   - Atualizar `tenant_id` do canal
   - Verificar relacionamento com usuário

3. **Canal Inativo**:
   ```sql
   UPDATE channels 
   SET status = 'active' 
   WHERE id = 'CANAL_ID';
   ```

---

### 3. Pagamentos Não Processam

#### Sintomas
- Webhook não recebe notificações
- Invoice fica "pending" eternamente
- Assinatura não ativa após pagamento

#### Diagnóstico Passo a Passo

**A. Verificar se Webhook Está Registrado**

*Stripe*:
```bash
# Listar webhooks
curl https://api.stripe.com/v1/webhook_endpoints \
  -u sk_live_...:

# Verificar eventos
curl https://api.stripe.com/v1/events?limit=10 \
  -u sk_live_...:
```

*Mercado Pago*:
```bash
# Verificar configuração IPN
curl https://api.mercadopago.com/v1/payment_methods \
  -H "Authorization: Bearer APP_USR-..."
```

**B. Verificar Secrets Configurados**

```sql
-- No Supabase, verificar secrets
-- Lovable → Backend → Secrets

-- Secrets necessários:
-- STRIPE_WEBHOOK_SECRET
-- MERCADOPAGO_WEBHOOK_SECRET
-- ASAAS_WEBHOOK_TOKEN
-- INFINITEPAY_WEBHOOK_SECRET
```

**C. Testar Webhook Localmente**

```bash
# Stripe
curl -X POST https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_123",
        "payment_status": "paid",
        "metadata": {
          "tenant_id": "SEU_TENANT_ID",
          "invoice_id": "INVOICE_ID"
        }
      }
    }
  }'
```

**D. Verificar Logs do Webhook**

1. Acesse: Lovable → Backend → Edge Functions
2. Selecione: `stripe-webhook` (ou outro)
3. Procure por:
   - Eventos recebidos
   - Erros de validação
   - Problemas de banco

**E. Verificar Invoice e Subscription**

```sql
-- Buscar invoices recentes
SELECT 
  i.*,
  s.status as subscription_status,
  t.name as tenant_name
FROM invoices i
LEFT JOIN subscriptions s ON i.subscription_id = s.id
LEFT JOIN tenants t ON i.tenant_id = t.id
WHERE i.created_at > NOW() - INTERVAL '7 days'
ORDER BY i.created_at DESC;

-- Verificar se metadata está correta
SELECT 
  id,
  status,
  amount,
  metadata
FROM invoices
WHERE id = 'INVOICE_ID';
```

**Soluções**:

1. **Webhook Não Registrado**:
   - Registrar no dashboard do gateway
   - Usar URL completa: `https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/[gateway]-webhook`

2. **Assinatura Inválida**:
   ```bash
   # Testar assinatura manualmente (Stripe)
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```

3. **Metadata Faltando**:
   - Sempre incluir `tenant_id` e `invoice_id` ao criar pagamento
   - Verificar se gateway suporta metadata

4. **Invoice Não Atualiza**:
   ```sql
   -- Processar manualmente
   SELECT process_invoice_payment('INVOICE_ID');
   ```

---

### 4. Assinaturas Não Renovam Automaticamente

#### Sintomas
- Assinatura expira mas não gera nova invoice
- Cron job não roda
- Status não muda de "active" para "expired"

#### Diagnóstico Passo a Passo

**A. Verificar Cron Job**

```sql
-- Listar cron jobs
SELECT * FROM cron.job;

-- Deve ter:
-- Nome: check-expired-subscriptions-daily
-- Schedule: 0 0 * * * (todo dia à meia-noite)
-- Command: http_post para check-expired-subscriptions function
```

**B. Verificar Edge Function Logs**

1. Acesse: Lovable → Backend → Edge Functions
2. Selecione: `check-expired-subscriptions`
3. Verifique última execução

**C. Rodar Manualmente**

```bash
# Invocar function manualmente
curl -X POST https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/check-expired-subscriptions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmc2VlZXh3YWZ6bWV6dWZ3ZHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTk2OTIsImV4cCI6MjA3NTQzNTY5Mn0.JGLZs1_NyLyurkJWLd6DnwYEXMQ7ZZ6qWpl9uB9Pz_4" \
  -H "Content-Type: application/json"
```

**D. Verificar Assinaturas Expiradas**

```sql
-- Buscar assinaturas que deveriam renovar
SELECT 
  s.*,
  t.name as tenant_name,
  p.name as plan_name,
  p.billing_period
FROM subscriptions s
JOIN tenants t ON s.tenant_id = t.id
JOIN plans p ON s.plan_id = p.id
WHERE s.expires_at <= NOW()
AND s.status = 'active';
```

**E. Verificar se Gateway Está Configurado**

```sql
-- Tenant precisa ter gateway ativo
SELECT 
  pg.*,
  t.name as tenant_name
FROM payment_gateways pg
JOIN tenants t ON pg.tenant_id = t.id
WHERE pg.is_active = true;
```

**Soluções**:

1. **Cron Não Configurado**:
   ```sql
   -- Criar cron job
   SELECT cron.schedule(
     'check-expired-subscriptions-daily',
     '0 0 * * *',
     $$
     SELECT net.http_post(
       url:='https://yfseeexwafzmezufwdxq.supabase.co/functions/v1/check-expired-subscriptions',
       headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmc2VlZXh3YWZ6bWV6dWZ3ZHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTk2OTIsImV4cCI6MjA3NTQzNTY5Mn0.JGLZs1_NyLyurkJWLd6DnwYEXMQ7ZZ6qWpl9uB9Pz_4"}'::jsonb
     ) as request_id;
     $$
   );
   ```

2. **Gateway Não Configurado**:
   - Configurar gateway de pagamento em `/payments`
   - Ativar gateway para o tenant

3. **Trigger Não Dispara**:
   ```sql
   -- Verificar se trigger existe
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_check_subscription_expiry';
   ```

4. **Processar Manualmente**:
   ```sql
   -- Gerar invoice manualmente
   INSERT INTO invoices (tenant_id, subscription_id, amount, currency, due_date, status, description)
   VALUES ('TENANT_ID', 'SUBSCRIPTION_ID', 99.90, 'BRL', NOW() + INTERVAL '30 days', 'pending', 'Renovação manual');
   ```

---

## 📊 Comandos Úteis de Diagnóstico

### Ver Últimas Atividades

```sql
-- Últimos canais criados
SELECT * FROM channels ORDER BY created_at DESC LIMIT 10;

-- Últimas mensagens
SELECT * FROM messages ORDER BY created_at DESC LIMIT 20;

-- Últimos tickets
SELECT * FROM tickets ORDER BY created_at DESC LIMIT 10;

-- Últimas invoices
SELECT * FROM invoices ORDER BY created_at DESC LIMIT 10;

-- Últimos pagamentos
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;
```

### Estatísticas

```sql
-- Canais por status
SELECT type, status, COUNT(*) 
FROM channels 
GROUP BY type, status;

-- Tickets por status
SELECT status, COUNT(*) 
FROM tickets 
GROUP BY status;

-- Invoices por status
SELECT status, COUNT(*), SUM(amount) 
FROM invoices 
GROUP BY status;
```

### Limpar Dados de Teste

```sql
-- CUIDADO: Apenas em desenvolvimento!

-- Deletar mensagens de teste
DELETE FROM messages WHERE content LIKE '%teste%';

-- Deletar contatos de teste
DELETE FROM contacts WHERE name LIKE '%Teste%';

-- Deletar tickets de teste
DELETE FROM tickets WHERE id IN (
  SELECT t.id FROM tickets t
  JOIN contacts c ON t.contact_id = c.id
  WHERE c.name LIKE '%Teste%'
);
```

---

## 🆘 Quando Pedir Ajuda

Se após seguir este guia o problema persistir, colete estas informações:

1. **Logs da Edge Function**: Screenshots ou texto dos logs
2. **Query do Banco**: Resultado das queries de diagnóstico
3. **Configuração**: JSON do `config` do canal/gateway
4. **Erro Específico**: Mensagem de erro completa
5. **Passos para Reproduzir**: Como gerar o problema novamente

---

**Última Atualização**: 2025-10-21
