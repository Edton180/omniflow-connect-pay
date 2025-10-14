# Arquitetura do Sistema OmniFlow

## Stack Tecnológica

### Frontend
- **React 18** com TypeScript
- **Vite** como bundler
- **TailwindCSS** para estilização
- **shadcn/ui** para componentes
- **React Router** para navegação
- **React Query** para gerenciamento de estado
- **Zod** para validação

### Backend
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Edge Functions** (Deno) para lógica serverless
- **Row Level Security (RLS)** para segurança

## Estrutura Multi-Tenant

### Tabelas Principais

#### profiles
- `id` (UUID, FK auth.users)
- `tenant_id` (UUID, FK tenants)
- `full_name` (TEXT)
- `email` (TEXT)
- `avatar_url` (TEXT)
- `phone` (TEXT)
- `setup_completed` (BOOLEAN)

#### tenants
- `id` (UUID, PK)
- `name` (TEXT, UNIQUE)
- `slug` (TEXT)
- `status` (ENUM: active, inactive, suspended)
- `subscription_plan` (UUID, FK plans)
- `city` (UUID, FK cities)
- `state` (TEXT)
- `segment` (ENUM: delivery, varejo, servicos)

#### user_roles
- `id` (UUID, PK)
- `user_id` (UUID, FK profiles)
- `tenant_id` (UUID, FK tenants, NULL para super_admin)
- `role` (ENUM: super_admin, tenant_admin, manager, agent, user)

### Funções RLS

```sql
-- Verifica se usuário tem role específica
CREATE FUNCTION has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- Verifica se usuário tem acesso ao tenant
CREATE FUNCTION has_tenant_access(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  ) OR has_role(_user_id, 'super_admin')
$$ LANGUAGE SQL SECURITY DEFINER;
```

### Políticas RLS Padrão

Para todas as tabelas com `tenant_id`:

```sql
-- Super admins veem tudo
CREATE POLICY "Super admins can view all"
ON table_name FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

-- Tenant admins veem apenas seu tenant
CREATE POLICY "Tenant admins can view their data"
ON table_name FOR SELECT
USING (has_tenant_access(auth.uid(), tenant_id));
```

## Fluxo de Autenticação

### Primeiro Usuário (Super Admin)
1. Usuário faz signup em `/auth`
2. Trigger `handle_new_user` cria perfil automático
3. Hook `useAuth` verifica se é primeiro usuário
4. Se sim, atribui role `super_admin`
5. Redireciona para `/dashboard`

### Usuários Subsequentes
1. Usuário faz signup em `/auth`
2. Trigger cria perfil com `setup_completed = false`
3. Redireciona para `/setup`
4. SetupWizard mostra `CompanySetupWizard`
5. Usuário cria empresa ou é convidado para existente
6. RPC `auto_assign_tenant` associa usuário e cria role `tenant_admin`
7. Redireciona para `/dashboard`

## Módulos do Sistema

### 1. Sistema de Autenticação
**Arquivos principais:**
- `src/hooks/useAuth.tsx` - Hook customizado de autenticação
- `src/components/AuthGuard.tsx` - Proteção de rotas
- `src/pages/Auth.tsx` - Página de login/signup

**Fluxo:**
```
Login → useAuth → Supabase Auth → Fetch Profile → Fetch Roles → Set State
```

### 2. Sistema de Saques
**Arquivos principais:**
- `src/pages/Withdrawals.tsx` - Tenant solicita saque
- `src/pages/AdminWithdrawals.tsx` - Super admin aprova
- Tabela: `withdrawal_requests`

**Fluxo:**
```
Tenant → Solicita Saque → Status: pending
↓
Super Admin → Aprova/Rejeita → Status: approved/rejected
↓
Se aprovado → Atualiza tenant_balances
```

### 3. Sistema de Catálogo
**Arquivos principais:**
- `src/pages/Catalog.tsx` - Gerenciamento produtos
- `src/pages/Categories.tsx` - Gerenciamento categorias
- `src/pages/Orders.tsx` - Gerenciamento pedidos
- `src/pages/CatalogLandingEditor.tsx` - Editor landing page

**Tabelas:**
- `catalog_products` - Produtos
- `catalog_categories` - Categorias
- `catalog_product_variations` - Variações (tamanhos, cores)
- `catalog_product_optionals` - Opcionais pagos
- `catalog_orders` - Pedidos
- `catalog_order_items` - Itens do pedido

### 4. CRM / Kanban
**Arquivos principais:**
- `src/pages/CRM.tsx` - Board Kanban

**Tabelas:**
- `crm_columns` - Colunas do board
- `crm_leads` - Leads/cards

### 5. Chat Interno
**Arquivos principais:**
- `src/pages/InternalChat.tsx` - Interface de chat

**Tabelas:**
- `internal_messages` - Mensagens
- `teams` - Equipes
- `team_members` - Membros das equipes

## Edge Functions

### auto_assign_tenant
Cria um tenant automaticamente para o usuário se ele não tiver um.

**Parâmetros:**
- `_user_id` (UUID)
- `_company_name` (TEXT)

**Retorna:** `tenant_id` (UUID)

### check_and_generate_invoices
Verifica assinaturas expiradas e gera faturas automaticamente.

### process_invoice_payment
Processa pagamento de fatura e renova assinatura.

### process_catalog_order_payment
Processa pagamento de pedido do catálogo e atualiza saldo do tenant.

## Segurança

### RLS Policies
- ✅ Todas as tabelas têm RLS habilitado
- ✅ Super admins têm acesso total via `has_role()`
- ✅ Tenants têm acesso apenas aos seus dados via `has_tenant_access()`
- ✅ Security Definer functions para evitar recursão RLS

### Validação de Input
- ✅ Zod schemas em todos os formulários
- ✅ Validação client-side e server-side
- ✅ Sanitização de strings (trim, lowercase, regex)

### Autenticação
- ✅ JWT tokens via Supabase Auth
- ✅ Auto-refresh de tokens
- ✅ Sessões persistentes em localStorage
- ✅ Cleanup em logout

## Performance

### Otimizações Implementadas
- ✅ Indexes em colunas frequentemente consultadas (`tenant_id`, `status`, `created_at`)
- ✅ Composite indexes para queries complexas
- ✅ React Query para cache de dados
- ✅ Lazy loading de componentes
- ✅ Debounce em inputs de busca

### Próximas Otimizações
- [ ] Virtual scrolling para listas longas
- [ ] Image optimization e lazy loading
- [ ] Code splitting avançado
- [ ] Service Worker para cache de assets

## Deploy

### Lovable Cloud
- Frontend: Deploy automático via Lovable
- Backend: Supabase integrado via Lovable Cloud
- Edge Functions: Deploy automático

### Variáveis de Ambiente
```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
VITE_SUPABASE_PROJECT_ID=[project-id]
```

## Próximos Passos

1. **PWA Completo**
   - Service Worker
   - Manifest.json
   - Offline support
   - Push notifications

2. **Integrações Gateway**
   - Mercado Pago
   - PagSeguro
   - GetNet
   - Stripe

3. **Sistema de Frete**
   - Integração Correios
   - Cálculo automático
   - Entrega própria

4. **Sistema de Afiliados**
   - Códigos de referência
   - Comissões
   - Dashboard afiliado

5. **Relatórios Avançados**
   - Vendas por período
   - Performance de produtos
   - Análise de clientes
   - Export Excel/PDF
