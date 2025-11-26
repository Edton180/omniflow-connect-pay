# Guia de Segurança do OmniFlow

## 📋 Índice
1. [Segurança de Dados](#segurança-de-dados)
2. [Autenticação e Autorização](#autenticação-e-autorização)
3. [Proteção contra Ataques](#proteção-contra-ataques)
4. [Boas Práticas](#boas-práticas)
5. [Auditoria e Monitoramento](#auditoria-e-monitoramento)

## 🔒 Segurança de Dados

### Row Level Security (RLS)
Todas as tabelas críticas do sistema possuem RLS habilitado, garantindo que:
- Usuários só acessam dados do próprio tenant
- Super Admins têm acesso global quando necessário
- Cada operação é validada tanto no frontend quanto no banco

### Validação de Entrada
- ✅ Validação client-side e server-side
- ✅ Sanitização de inputs HTML
- ✅ Validação de tipos de arquivo
- ✅ Limites de tamanho de upload (5MB)
- ✅ Validação de URLs de storage

### Criptografia
- Senhas armazenadas com hash seguro via Supabase Auth
- Comunicação exclusivamente via HTTPS
- Tokens JWT com expiração configurada
- Secrets armazenados com criptografia no banco

## 🔑 Autenticação e Autorização

### Hierarquia de Papéis
1. **Super Admin**: Acesso total ao sistema
2. **Tenant Admin**: Gerenciamento completo do tenant
3. **Manager**: Gestão de equipe e operações
4. **Agent**: Atendimento e tickets
5. **User**: Acesso básico

### Proteção de Rotas
```typescript
// Exemplo de proteção
<AuthGuard requireAuth requiredRoles={['super_admin']}>
  <AdminPanel />
</AuthGuard>
```

### Sessões
- Refresh automático de tokens
- Logout forçado em caso de inatividade
- Verificação de sessão em todas as requisições

## 🛡️ Proteção contra Ataques

### SQL Injection
- ✅ Uso exclusivo de prepared statements
- ✅ Validação de UUIDs
- ✅ Funções de banco com search_path fixo
- ❌ NUNCA usar concatenação de strings em SQL

### XSS (Cross-Site Scripting)
- ✅ Sanitização de todos os inputs
- ✅ Uso de Content Security Policy
- ✅ Escapamento automático de React
- ⚠️ Uso controlado de `dangerouslySetInnerHTML`

### CSRF (Cross-Site Request Forgery)
- ✅ Tokens JWT em headers (não cookies)
- ✅ CORS configurado com domínios permitidos
- ✅ Validação de origem em webhooks

### Rate Limiting
- Limite de 5 tentativas de login em 1 minuto
- Throttling em endpoints críticos
- Proteção contra brute force

### Path Traversal
- ✅ Validação de nomes de arquivo
- ✅ Bloqueio de caracteres perigosos (../, ..\)
- ✅ Armazenamento em caminhos seguros

## 📝 Boas Práticas

### Para Desenvolvedores

#### Validação de Entrada
```typescript
import { validateEmail, sanitizeText, validateUUID } from '@/lib/security';

// Sempre validar
if (!validateEmail(email)) {
  throw new Error('Email inválido');
}

// Sempre sanitizar
const cleanText = sanitizeText(userInput);
```

#### Upload de Arquivos
```typescript
import { validateFileUpload } from '@/lib/security';

const validation = validateFileUpload(
  file,
  ['image/jpeg', 'image/png', 'application/pdf'],
  5 // 5MB max
);

if (!validation.valid) {
  toast.error(validation.error);
  return;
}
```

#### Edge Functions
```typescript
// Sempre usar CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sempre validar inputs
if (!invoiceId || !validateUUID(invoiceId)) {
  throw new Error('ID inválido');
}

// Sempre usar service role key para operações privilegiadas
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
```

### Para Usuários

#### Senhas Seguras
- Mínimo 8 caracteres
- Pelo menos 1 maiúscula
- Pelo menos 1 minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial

#### Gestão de Acessos
- Revisar regularmente usuários ativos
- Remover acessos desnecessários
- Usar princípio do menor privilégio
- Ativar notificações de segurança

## 🔍 Auditoria e Monitoramento

### Logs de Segurança
- Todas as autenticações são registradas
- Tentativas de acesso negadas são monitoradas
- Mudanças em configurações sensíveis são auditadas

### Alertas Automáticos
- Múltiplas tentativas de login falhadas
- Alterações em configurações de pagamento
- Upload de arquivos suspeitos
- Acessos de IPs não reconhecidos

### Verificações Periódicas
- ✅ Scan de vulnerabilidades (linter do Supabase)
- ✅ Revisão de políticas RLS
- ✅ Atualização de dependências
- ✅ Testes de penetração (recomendado)

## 🚨 Reporte de Vulnerabilidades

Se você identificar uma vulnerabilidade de segurança:
1. **NÃO** abra uma issue pública
2. Entre em contato diretamente com a equipe de segurança
3. Forneça detalhes técnicos e passos para reproduzir
4. Aguarde confirmação antes de divulgar publicamente

## 📊 Conformidade

### LGPD (Lei Geral de Proteção de Dados)
- Dados pessoais criptografados
- Consentimento explícito para coleta
- Direito ao esquecimento implementado
- Portabilidade de dados disponível

### Retenção de Dados
- Logs: 90 dias
- Dados de clientes: conforme contrato
- Backups: 30 dias

## 🔄 Atualizações de Segurança

Este documento é atualizado regularmente. Última revisão: 26/11/2025

### Changelog de Segurança
- **26/11/2025**: 
  - Implementada validação de URL de comprovantes
  - Adicionadas funções de segurança centralizadas
  - Corrigidas funções sem search_path
  - Habilitada proteção contra senhas vazadas
  - Implementado rate limiting básico
  - Adicionada validação de path traversal em uploads

---

**Nota**: A segurança é responsabilidade de todos. Se você notar algo suspeito ou tiver sugestões, por favor reporte imediatamente.
