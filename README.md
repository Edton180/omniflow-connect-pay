# 🚀 OmniFlow - Plataforma Multi-Tenant de Atendimento

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)
[![Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4.svg)](https://lovable.dev)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](CHANGELOG.md)

Sistema completo de atendimento multi-tenant com suporte a múltiplos canais (WhatsApp, Email, Telegram, Instagram, Facebook) e gestão de tickets.

## ✨ Features Principais

### Multi-tenant & Roles
- ✅ Sistema completo multi-tenant com isolamento de dados
- ✅ Super Admin, Tenant Admin e Agent roles
- ✅ Gestão de tenants pelo Super Admin

### Atendimento Omnichannel
- ✅ **WhatsApp Business API**: Integração oficial via Cloud API
- ✅ **Email**: SMTP configurável por tenant
- ✅ **Telegram**: Bot integration com webhooks
- ✅ **Instagram**: Direct Messages via Graph API
- ✅ **Facebook**: Messenger Platform
- ✅ **WebChat**: Widget personalizável para seu site

### Sistema de Tickets
- ✅ Gestão completa de atendimentos
- ✅ Chat em tempo real (Realtime WebSocket)
- ✅ Histórico de mensagens
- ✅ Status e prioridades
- ✅ Atribuição automática de agentes
- ✅ Encaminhamento para filas/agentes/bot

### Filas & Distribuição
- ✅ Filas customizáveis por tenant
- ✅ SLA configurável
- ✅ Cores e identificação visual
- ✅ Distribuição round-robin inteligente

### Pagamentos Integrados
- ✅ **ASAAS**: Gateway brasileiro completo
- ✅ **Mercado Pago**: Pagamentos e cobranças (PIX, Cartão, Boleto)
- ✅ **Stripe**: Pagamentos internacionais
- ✅ **PayPal**: Pagamentos globais
- ✅ **Pagamento Manual**: Comprovantes e aprovação manual
- ✅ Sistema de planos e assinaturas recorrentes
- ✅ **Sistema de Faturas**: Geração automática e manual
- ✅ **Controle de Vencimentos**: Alertas e bloqueio automático
- ✅ **Dashboard de Receita**: Gráficos e relatórios financeiros

### Marca Branca (White Label)
- ✅ Upload de logo personalizado
- ✅ Cores primárias e secundárias customizáveis
- ✅ Domínio personalizado
- ✅ Favicon e meta tags configuráveis
- ✅ Landing page totalmente editável

### Inteligência Artificial
- ✅ **Lovable AI**: IA integrada sem necessidade de API key
- ✅ Sugestões de respostas automáticas
- ✅ Análise de sentimento
- ✅ Resumo de conversas
- ✅ Base de conhecimento inteligente

### Dashboard & Analytics
- ✅ Métricas em tempo real
- ✅ Gráficos de tickets
- ✅ Status de canais
- ✅ Estatísticas de performance
- ✅ **Dashboard de Receita**: Análise financeira completa
- ✅ **Logs de Auditoria**: Rastreamento completo de ações

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** + TypeScript
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - Component library
- **React Query** - Data fetching
- **React Router** - Routing

### Backend
- **Lovable Cloud** (PostgreSQL)
- **Edge Functions** - Serverless functions
- **Row Level Security** - Security
- **Realtime** - WebSocket subscriptions
- **Storage** - File uploads

### Infrastructure
- **Docker** + Docker Compose
- **Nginx** - Web server
- **Multi-stage builds**
- **Health checks**

## 📦 Instalação

### 📚 Guias Completos de Instalação

- **[INSTALLATION.md](INSTALLATION.md)** - Guia completo passo a passo
- **[DEPLOY.md](DEPLOY.md)** - Deploy em produção (VPS, Docker)
- **[MANUAL_INSTALL_CPANEL.md](MANUAL_INSTALL_CPANEL.md)** - Instalação em cPanel
- **[MANUAL_INSTALL_VIRTUALBOX.md](MANUAL_INSTALL_VIRTUALBOX.md)** - Instalação em VirtualBox

### Opção 1: Lovable (Recomendado para Desenvolvimento)

O OmniFlow usa Lovable Cloud como backend, que já inclui banco de dados, autenticação, storage e edge functions.

### Opção 2: Script Automático (Produção VPS)

```bash
# Download e execute o script de instalação
curl -sSL https://raw.githubusercontent.com/Edton180/omniflow-connect-pay/main/scripts/auto-install.sh | sudo bash
```

O script irá:
- Instalar Docker e Docker Compose
- Clonar o repositório
- Configurar variáveis de ambiente
- Build e iniciar a aplicação

### Opção 3: Docker Compose Manual

```bash
# 1. Clone o repositório
git clone https://github.com/Edton180/omniflow-connect-pay.git
cd omniflow-connect-pay

# 2. Configure as variáveis de ambiente
cp .env.example .env
nano .env

# 3. Build e start
docker-compose up -d --build

# 4. Verificar status
docker-compose ps
```

### Opção 4: Desenvolvimento Local

```bash
# 1. Clone o repositório
git clone https://github.com/Edton180/omniflow-connect-pay.git
cd omniflow-connect-pay

# 2. Instale as dependências
npm install

# 3. Configure .env
cp .env.example .env

# 4. Execute em modo desenvolvimento
npm run dev
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Lovable Cloud - Configuradas automaticamente pelo Lovable
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
VITE_SUPABASE_PROJECT_ID=seu-project-id

# Produção
NODE_ENV=production
```

### Primeiro Acesso

1. Acesse a aplicação
2. Clique em **Criar Conta** ou **Começar Agora**
3. Preencha seus dados (email, senha e nome completo)
4. O primeiro usuário será automaticamente configurado como **Super Admin**
5. Você será redirecionado para a página de setup
6. Após o setup, acesse o painel Super Admin para:
   - Configurar canais de atendimento
   - Criar tenants (empresas)
   - Configurar planos e preços
   - Personalizar a landing page
   - Gerenciar gateways de pagamento

## 🚀 Deploy

### Deploy via Lovable

1. Abra o projeto no Lovable
2. Clique em **Share → Publish**
3. Seu app estará online!

### Deploy em VPS/Cloud

Consulte o [Guia Completo de Deploy](DEPLOY.md) para instruções detalhadas sobre:
- AWS EC2
- Google Cloud Platform
- DigitalOcean
- Azure
- VPS genérico

### Docker em Produção

```bash
# Build para produção
docker-compose -f docker-compose.yml up -d --build

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

## 📚 Documentação

### Guias de Setup e Deploy
- **[INSTALLATION.md](INSTALLATION.md)** - Instalação completa passo a passo
- **[DEPLOY.md](DEPLOY.md)** - Deploy para produção em VPS/Cloud
- **[MANUAL_INSTALL_CPANEL.md](MANUAL_INSTALL_CPANEL.md)** - Instalação em cPanel
- **[SUPER_ADMIN_SETUP.md](SUPER_ADMIN_SETUP.md)** - Configuração Super Admin
- **[BILLING_SYSTEM.md](BILLING_SYSTEM.md)** - Sistema de Faturamento

### Guias Técnicos
- **[BRANDING_GUIDE.md](BRANDING_GUIDE.md)** - Customização de marca
- **[WEBHOOK_SETUP_GUIDE.md](WEBHOOK_SETUP_GUIDE.md)** - Configuração de Webhooks
- **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Guia de Integrações
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Como contribuir
- **[CHANGELOG.md](CHANGELOG.md)** - Histórico de versões

---

## 🏗️ Estrutura do Projeto

```
omniflow/
├── src/
│   ├── components/          # Componentes React
│   │   ├── ui/             # shadcn/ui components
│   │   ├── admin/          # Administração
│   │   ├── channels/       # Canais de comunicação
│   │   ├── contacts/       # Gestão de contatos
│   │   ├── dashboard/      # Dashboard e métricas
│   │   ├── payments/       # Pagamentos
│   │   ├── queues/         # Filas
│   │   └── tickets/        # Tickets
│   ├── pages/              # Páginas/Rotas
│   ├── hooks/              # Custom hooks
│   ├── integrations/       # Integrações (Supabase)
│   └── lib/                # Utilitários
├── supabase/               # Configuração Supabase
│   └── functions/          # Edge Functions
├── scripts/                # Scripts de deploy/manutenção
├── Dockerfile              # Docker image
├── docker-compose.yml      # Orquestração
├── nginx.conf              # Nginx config
└── INSTALLATION.md         # Documentação de instalação
```

## 🔐 Segurança

- **Row Level Security (RLS)** em todas as tabelas
- **Isolamento completo** entre tenants
- **Autenticação** via Auth integrado
- **Storage seguro** com RLS policies
- **HTTPS** obrigatório em produção
- **Rate limiting** configurado no Nginx
- **Logs de Auditoria** para rastreamento

## 📈 Performance

- Build otimizado com **Vite**
- **Code splitting** automático
- **Lazy loading** de componentes
- Compressão **Gzip/Brotli**
- Cache de assets estáticos
- **Realtime** otimizado

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Dev server com hot reload
npm run build            # Build para produção
npm run preview          # Preview do build local

# Docker
docker-compose up -d     # Iniciar em background
docker-compose down      # Parar e remover containers
docker-compose logs -f   # Ver logs em tempo real
docker-compose restart   # Reiniciar serviços

# Manutenção (Produção)
./scripts/update.sh      # Atualizar aplicação
./scripts/backup.sh      # Criar backup
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia nosso [Guia de Contribuição](CONTRIBUTING.md).

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona NovaFeature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## 🗺️ Roadmap

- [ ] **Automações Avançadas**: Workflows customizáveis
- [ ] **CRM Integration**: HubSpot, Salesforce, Pipedrive
- [ ] **App Mobile**: React Native para iOS e Android
- [ ] **API Pública**: REST API documentada
- [ ] **Templates**: Templates de mensagens avançados
- [ ] **Reports**: Relatórios avançados e exportação
- [ ] **ERP Integration**: Integração com ERPs

## 🆘 Suporte

- 📚 [Documentação Completa](INSTALLATION.md)
- 🐛 [Reportar Bug](https://github.com/Edton180/omniflow-connect-pay/issues)
- 💡 [Solicitar Feature](https://github.com/Edton180/omniflow-connect-pay/issues)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- [Lovable](https://lovable.dev) - Plataforma de desenvolvimento
- [shadcn/ui](https://ui.shadcn.com) - Component library
- [Tailwind CSS](https://tailwindcss.com) - CSS framework

---

**Desenvolvido com ❤️ para revolucionar o atendimento ao cliente**

**Status do Projeto**: ✅ Versão 1.0.0 - Pronto para Produção

- ✅ Fase 1: Fundação Multi-tenant
- ✅ Fase 2: Sistema de Atendimento
- ✅ Fase 3: Integrações de Canais
- ✅ Fase 4: Pagamentos
- ✅ Fase 5: Marca Branca
- ✅ Fase 6: Deploy e Infraestrutura
