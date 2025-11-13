# Correções do Sistema de Gateways de Pagamento

## Problemas Identificados e Soluções

### 1. **Gateway Global vs Por Tenant**

**Problema:** O sistema estava tentando buscar gateways por tenant específico, mas os gateways são configurados globalmente pelo Super Admin.

**Solução:** 
- Modificado `init-checkout` edge function para buscar apenas gateways globais (`tenant_id IS NULL`)
- Modificado `PaymentRequired.tsx` para buscar apenas gateways globais
- Os gateways configurados pelo Super Admin em `/payments` são salvos com `tenant_id = NULL`, tornando-os disponíveis para todos os tenants do sistema

### 2. **Mensagens de Erro Específicas**

**Problema:** Mensagens genéricas não ajudavam a identificar o problema real.

**Solução:**
- Adicionado tratamento específico para erro "invalid_environment" do ASAAS
- Mensagem agora indica claramente quando a API Key está incorreta ou é de ambiente diferente (Produção vs Sandbox)
- Mensagens diferenciadas entre "gateway não configurado" vs "erro de credenciais"

### 3. **Erro ao Criar Checkout**

**Problema:** A API Key do ASAAS estava configurada com chave de ambiente incorreto (Sandbox vs Produção).

**Solução:**
- A edge function agora detecta esse erro específico e retorna mensagem clara
- Usuário precisa verificar no painel do ASAAS se está usando:
  - Chave de Produção em ambiente de produção
  - Chave de Sandbox em ambiente de testes

### 4. **UX da Página de Pagamento Obrigatório**

**Problema:** Usuário ficava "preso" na página sem opção de sair.

**Solução:**
- Adicionado botão de Logout no canto superior direito
- Permite que o usuário saia e faça login com outra conta se necessário

## Como Funciona o Sistema de Gateways

### Configuração pelo Super Admin

1. Super Admin acessa `/payments`
2. Configura os gateways (ASAAS, Mercado Pago, Stripe, InfinitePay)
3. Os gateways são salvos com `tenant_id = NULL` (globais)
4. Esses gateways ficam disponíveis para processar pagamentos de TODOS os tenants

### Processamento de Pagamentos

1. Quando uma fatura vence, o tenant é bloqueado
2. Tenant acessa o sistema e é redirecionado para `/payment-required`
3. Sistema busca gateways globais configurados
4. Tenant pode pagar usando qualquer gateway configurado
5. Após pagamento confirmado (via webhook), tenant é desbloqueado

### Fluxo Correto

```
Tenant Vencido → /payment-required → Busca Gateways Globais → Gera Checkout → Pagamento → Webhook → Desbloqueio
```

## Verificações Necessárias

### Para o Super Admin:

1. ✅ Certificar que está usando API Keys corretas (Produção vs Sandbox)
2. ✅ Testar cada gateway após configuração
3. ✅ Verificar webhooks configurados corretamente

### Chaves ASAAS:

- **Sandbox:** Começa com `$aact_YTU5YTE0M...` (para testes)
- **Produção:** Começa com `$aact_...` (para cobranças reais)
- ⚠️ Não misturar chaves de ambientes diferentes!

### Para o Tenant:

1. ✅ Manter cartão/dados de pagamento atualizados
2. ✅ Pagar faturas antes do vencimento
3. ✅ Se bloqueado, acessar `/payment-required` e realizar pagamento

## Arquivos Modificados

1. `supabase/functions/init-checkout/index.ts` - Busca gateways globais e melhora mensagens de erro
2. `src/pages/PaymentRequired.tsx` - Adiciona botão de logout e busca gateways globais
3. `src/components/payments/PaymentGatewayList.tsx` - Clarifica que gateways são globais

## Próximos Passos Recomendados

- [ ] Implementar dashboard de monitoramento de pagamentos
- [ ] Criar sistema de notificações para faturas próximas do vencimento
- [ ] Adicionar histórico completo de transações
- [ ] Implementar retry automático de webhooks falhados
- [ ] Criar relatórios de receita e inadimplência
