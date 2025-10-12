# Sistema de Faturamento

Este documento descreve o sistema de faturamento integrado do OmniFlow, incluindo geração automática de faturas, processamento de pagamentos e integração com gateways.

## Visão Geral

O sistema de faturamento permite:
- Geração automática de faturas baseada em assinaturas
- Processamento de pagamentos através de múltiplos gateways
- Controle de vencimentos e faturas vencidas
- Histórico completo de pagamentos

## Arquitetura

### Tabelas do Banco de Dados

#### `invoices`
Armazena todas as faturas geradas no sistema.

```sql
- id: UUID (Primary Key)
- tenant_id: UUID (Referência ao inquilino)
- subscription_id: UUID (Referência à assinatura)
- amount: NUMERIC (Valor da fatura)
- currency: TEXT (Moeda - padrão: BRL)
- status: TEXT (pending, paid, overdue, cancelled)
- due_date: TIMESTAMP (Data de vencimento)
- paid_at: TIMESTAMP (Data de pagamento)
- payment_id: UUID (Referência ao pagamento)
- description: TEXT (Descrição da fatura)
- metadata: JSONB (Metadados adicionais)
```

### Edge Functions

#### `generate-invoice`
Gera uma nova fatura baseada em uma assinatura.

**Endpoint**: `https://[PROJECT_ID].supabase.co/functions/v1/generate-invoice`

**Parâmetros**:
```json
{
  "subscriptionId": "uuid",
  "dueDate": "2025-01-15T00:00:00Z", // Opcional
  "description": "Descrição personalizada" // Opcional
}
```

**Resposta**:
```json
{
  "success": true,
  "invoice": {
    "id": "uuid",
    "amount": 99.90,
    "due_date": "2025-01-15T00:00:00Z",
    "status": "pending"
  }
}
```

#### `process-invoice-payment`
Processa o pagamento de uma fatura utilizando o gateway configurado.

**Endpoint**: `https://[PROJECT_ID].supabase.co/functions/v1/process-invoice-payment`

**Parâmetros**:
```json
{
  "invoiceId": "uuid"
}
```

**Resposta**:
```json
{
  "success": true,
  "message": "Pagamento processado com sucesso!",
  "payment": {
    "id": "uuid",
    "status": "completed",
    "gateway_payment_id": "mp_123456789"
  }
}
```

## Fluxo de Faturamento

### 1. Geração de Faturas

As faturas podem ser geradas de duas formas:

**Manual** (através da edge function):
```typescript
const { data } = await supabase.functions.invoke('generate-invoice', {
  body: {
    subscriptionId: 'uuid-da-assinatura',
    dueDate: '2025-01-15T00:00:00Z'
  }
});
```

**Automática** (usando pg_cron):
Configure um cron job para gerar faturas mensalmente:

```sql
SELECT cron.schedule(
  'generate-monthly-invoices',
  '0 0 1 * *', -- Todo dia 1 às 00:00
  $$
  SELECT net.http_post(
    url:='https://[PROJECT_ID].supabase.co/functions/v1/generate-invoice',
    headers:='{"Authorization": "Bearer [ANON_KEY]"}'::jsonb,
    body:=concat('{"subscriptionId": "', subscription_id, '"}')::jsonb
  )
  FROM subscriptions
  WHERE status = 'active';
  $$
);
```

### 2. Processamento de Pagamentos

O sistema suporta múltiplos gateways de pagamento:
- Mercado Pago
- Stripe
- PagSeguro
- Outros (configuráveis)

**Fluxo**:
1. Usuário clica em "Pagar Fatura"
2. Sistema busca o gateway ativo do tenant
3. Processa o pagamento através da edge function
4. Cria registro na tabela `payments`
5. Atualiza status da fatura para `paid`

### 3. Controle de Vencimentos

Faturas são automaticamente marcadas como vencidas quando:
- `due_date < NOW()` e `status = 'pending'`

A interface visual destaca faturas vencidas com:
- Badge vermelho "Vencida"
- Alerta visual
- Data de vencimento em vermelho

## Interface do Usuário

### Página de Faturas

Localização: `/tenant/invoices` ou aba "Faturas" em `/tenant/settings`

**Recursos**:
- Listagem de todas as faturas
- Filtros por status
- Detalhes de cada fatura
- Botão de pagamento para faturas pendentes
- Indicadores visuais para faturas vencidas

### Cards de Fatura

Cada fatura exibe:
- Descrição
- Valor (formatado conforme moeda)
- Data de vencimento
- Status (badge colorido)
- Data de pagamento (se paga)
- Botão de ação (pagar/visualizar)

## Integrações com Gateways

### Estrutura Básica

```typescript
async function processGatewayPayment(
  invoice: Invoice,
  gateway: PaymentGateway
) {
  // 1. Validar configuração do gateway
  // 2. Criar transação no gateway
  // 3. Retornar resultado
  
  return {
    success: boolean,
    transactionId: string,
    message: string
  };
}
```

### Mercado Pago

```typescript
async function processMercadoPagoPayment(invoice, gateway) {
  const mercadopago = new MercadoPago(gateway.api_key_encrypted);
  
  const payment = await mercadopago.payment.create({
    transaction_amount: invoice.amount,
    description: invoice.description,
    payment_method_id: 'pix', // ou outro método
    payer: {
      email: tenant.email
    }
  });
  
  return {
    success: payment.status === 'approved',
    transactionId: payment.id,
    message: payment.status_detail
  };
}
```

### Stripe

```typescript
async function processStripePayment(invoice, gateway) {
  const stripe = new Stripe(gateway.api_key_encrypted);
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: invoice.amount * 100, // Stripe usa centavos
    currency: invoice.currency.toLowerCase(),
    description: invoice.description,
    metadata: {
      invoice_id: invoice.id,
      tenant_id: invoice.tenant_id
    }
  });
  
  return {
    success: paymentIntent.status === 'succeeded',
    transactionId: paymentIntent.id,
    message: paymentIntent.status
  };
}
```

## Segurança

### Row Level Security (RLS)

Todas as faturas têm RLS habilitado:

```sql
-- Usuários podem ver faturas do seu tenant
CREATE POLICY "Users can view invoices in their tenant"
  ON invoices FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

-- Admins do tenant podem gerenciar faturas
CREATE POLICY "Tenant admins can manage invoices"
  ON invoices FOR ALL
  USING (
    has_role(auth.uid(), 'tenant_admin') AND 
    has_tenant_access(auth.uid(), tenant_id)
  );
```

### Proteção de API Keys

- API keys dos gateways são armazenadas criptografadas
- Nunca expor keys no frontend
- Todas as chamadas de API são feitas via edge functions
- Validação de autenticação em todas as requests

## Notificações

### Faturas Vencidas

Implemente notificações automáticas:

```typescript
// Edge function: send-overdue-invoice-notifications
async function notifyOverdueInvoices() {
  const overdueInvoices = await supabase
    .from('invoices')
    .select('*, tenants(*)')
    .eq('status', 'pending')
    .lt('due_date', new Date().toISOString());
    
  for (const invoice of overdueInvoices) {
    await sendEmail({
      to: invoice.tenants.email,
      subject: 'Fatura Vencida',
      body: `Sua fatura de ${invoice.amount} está vencida...`
    });
  }
}
```

## Relatórios

### Métricas Importantes

- Total de faturas geradas
- Taxa de pagamento (pagas/total)
- Valor total de receita
- Faturas vencidas
- Tempo médio de pagamento

### Query de Exemplo

```sql
SELECT 
  COUNT(*) as total_invoices,
  SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
  SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
  SUM(amount) FILTER (WHERE status = 'paid') as total_revenue,
  AVG(EXTRACT(EPOCH FROM (paid_at - created_at))/86400) as avg_days_to_pay
FROM invoices
WHERE tenant_id = 'uuid';
```

## Manutenção

### Tarefas Regulares

1. **Limpeza de faturas antigas** (executar mensalmente):
```sql
DELETE FROM invoices 
WHERE status = 'cancelled' 
AND created_at < NOW() - INTERVAL '2 years';
```

2. **Atualizar status de faturas vencidas** (executar diariamente):
```sql
UPDATE invoices 
SET status = 'overdue' 
WHERE status = 'pending' 
AND due_date < NOW();
```

## Troubleshooting

### Fatura não foi gerada

1. Verificar se a assinatura está ativa
2. Verificar logs da edge function
3. Confirmar que o plano tem preço configurado

### Pagamento falhou

1. Verificar configuração do gateway
2. Verificar API keys
3. Revisar logs do gateway
4. Confirmar que o tenant tem gateway ativo

### Fatura não atualiza após pagamento

1. Verificar se o payment_id foi salvo
2. Confirmar que a transação foi concluída no gateway
3. Revisar logs da edge function process-invoice-payment

## Próximas Melhorias

- [ ] Suporte a parcelamento
- [ ] Geração de boletos
- [ ] Integração com mais gateways
- [ ] Relatórios avançados
- [ ] Webhooks para notificações
- [ ] Exportação de faturas em PDF
- [ ] Notas fiscais automáticas