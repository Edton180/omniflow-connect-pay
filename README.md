# 🚀 OmniFlow - Plataforma Multi-Tenant de Atendimento

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)

Sistema completo de atendimento multi-tenant com suporte a múltiplos canais (WhatsApp, Email, Telegram, Instagram, Facebook) e gestão de tickets.

## ✨ Features Principais

### Multi-tenant & Roles
- ✅ Sistema completo multi-tenant com isolamento de dados
- ✅ Super Admin, Tenant Admin e Agent roles
- ✅ Gestão de tenants pelo Super Admin

### Atendimento Omnichannel
- ✅ **WhatsApp via Baileys**: Conexão QR Code gratuita
- ✅ **WhatsApp via Evolution API**: Solução profissional escalável
- ✅ **WhatsApp Business API**: Integração oficial
- ✅ **Email**: SMTP configurável
- ✅ **Telegram**: Bot integration
- ✅ **Instagram**: Direct Messages
- ✅ **Facebook**: Messenger
- ✅ **WebChat**: Widget para seu site

### Sistema de Tickets
- ✅ Gestão completa de atendimentos
- ✅ Chat em tempo real (Supabase Realtime)
- ✅ Histórico de mensagens
- ✅ Status e prioridades
- ✅ Atribuição de agentes

### Filas & Distribuição
- ✅ Filas customizáveis por tenant
- ✅ SLA configurável
- ✅ Cores e identificação visual
- ✅ Distribuição inteligente

### Pagamentos Integrados
- ✅ **ASAAS**: Gateway brasileiro
- ✅ **Mercado Pago**: Pagamentos e cobranças
- ✅ **Stripe**: Pagamentos internacionais
- ✅ **InfinitePay**: Gateway moderno
- ✅ Sistema de planos e assinaturas
- ✅ **Sistema de Faturas**: Geração e pagamento automático
- ✅ **Controle de Vencimentos**: Alertas de faturas vencidas
- ✅ **Dashboard de Receita**: Gráficos e relatórios financeiros em tempo real

### Marca Branca (White Label)
- ✅ Upload de logo personalizado
- ✅ Cores primárias e secundárias customizáveis
- ✅ Domínio personalizado
- ✅ Aplicação automática em toda plataforma

### Dashboard & Analytics
- ✅ Métricas em tempo real
- ✅ Gráficos de tickets
- ✅ Status de canais
- ✅ Estatísticas de performance
- ✅ **Dashboard de Receita**: Análise financeira completa
- ✅ **Gráficos de Faturamento**: Visualização de receitas e pagamentos
- ✅ **Relatórios Financeiros**: Exportação e análise de dados

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** + TypeScript
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - Component library
- **React Query** - Data fetching
- **React Router** - Routing

### Backend
- **Lovable Cloud** (Supabase)
- **PostgreSQL** - Database
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
- **[DEPLOY.md](DEPLOY.md)** - Deploy em produção (VPS, Docker, Portainer)
- **[EVOLUTION_API_SETUP.md](EVOLUTION_API_SETUP.md)** - Configuração Evolution API

### Opção 1: Script Automático (Recomendado para Produção)

```bash
# Download e execute o script de instalação
curl -o install.sh https://raw.githubusercontent.com/seu-usuario/omniflow/main/scripts/install.sh
chmod +x install.sh
sudo ./install.sh
```

O script irá:
- Instalar Docker e Docker Compose
- Clonar o repositório
- Configurar variáveis de ambiente
- Build e iniciar a aplicação

### Opção 2: Docker Compose Manual

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/omniflow.git
cd omniflow

# 2. Configure as variáveis de ambiente
cp .env.example .env
nano .env

# 3. Build e start
docker-compose up -d --build

# 4. Verificar status
docker-compose ps
```

### Opção 3: Desenvolvimento Local (Lovable)

**Use Lovable IDE**

Acesse o projeto diretamente no Lovable:
[https://lovable.dev/projects/bdc96e6e-0aab-497c-8a71-bacaedb7aa56](https://lovable.dev/projects/bdc96e6e-0aab-497c-8a71-bacaedb7aa56)

**Use seu IDE preferido**

```bash
# 1. Clone o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

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
# Supabase (Lovable Cloud)
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
5. Você será redirecionado para a página de setup onde poderá configurar seu perfil
6. Após o setup, acesse o painel Super Admin para:
   - Configurar Evolution API (se usar WhatsApp)
   - Criar tenants (empresas)
   - Configurar planos e preços
   - Personalizar a landing page
   - Gerenciar gateways de pagamento
   - Acompanhar receitas e faturamento

## 🚀 Deploy

### Deploy via Lovable

1. Abra o projeto no Lovable
2. Clique em **Share → Publish**
3. Seu app estará online!

### Deploy em VPS/Cloud

Consulte o [Guia Completo de Deploy](DEPLOYMENT.md) para instruções detalhadas sobre:
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
- **[EVOLUTION_API_SETUP.md](EVOLUTION_API_SETUP.md)** - Setup WhatsApp Evolution API
- **[BAILEYS_INTEGRATION.md](BAILEYS_INTEGRATION.md)** - Integração Baileys
- **[SUPER_ADMIN_SETUP.md](SUPER_ADMIN_SETUP.md)** - Configuração Super Admin
- **[BILLING_SYSTEM.md](BILLING_SYSTEM.md)** - Sistema de Faturamento

### Guias Técnicos
- **[BRANDING_GUIDE.md](BRANDING_GUIDE.md)** - Customização de marca
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Como contribuir
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Status do projeto

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
├── scripts/                # Scripts de deploy/manutenção
├── supabase/               # Configuração Supabase
│   └── migrations/         # Migrações SQL
├── Dockerfile              # Docker image
├── docker-compose.yml      # Orquestração
├── nginx.conf              # Nginx config
└── DEPLOYMENT.md           # Documentação de deploy
```

## 🔐 Segurança

- **Row Level Security (RLS)** em todas as tabelas
- **Isolamento completo** entre tenants
- **Autenticação** via Supabase Auth
- **Storage seguro** com RLS policies
- **HTTPS** obrigatório em produção
- **Rate limiting** configurado no Nginx

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

- [ ] **Automações**: Chatbots e respostas automáticas
- [ ] **CRM Integration**: HubSpot, Salesforce, Pipedrive
- [ ] **App Mobile**: React Native para iOS e Android
- [ ] **API Pública**: REST API documentada
- [ ] **Webhooks**: Webhooks customizáveis
- [ ] **Templates**: Templates de mensagens
- [ ] **Reports**: Relatórios avançados e exportação
- [ ] **ERP Integration**: Integração com ERPs

## 🆘 Suporte

- 📚 [Documentação Completa](DEPLOYMENT.md)
- 🐛 [Reportar Bug](https://github.com/seu-usuario/omniflow/issues)
- 💡 [Solicitar Feature](https://github.com/seu-usuario/omniflow/issues)
- 💬 Discord: [Em breve]

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- [Lovable](https://lovable.dev) - Plataforma de desenvolvimento
- [Supabase](https://supabase.com) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com) - Component library
- [Tailwind CSS](https://tailwindcss.com) - CSS framework

## 📞 Contato

Para questões comerciais e parcerias, entre em contato através de [seu-email@empresa.com]

---

**Desenvolvido com ❤️ para revolucionar o atendimento ao cliente**

**Status do Projeto**: ✅ Todas as 6 fases implementadas

- ✅ Fase 1: Fundação Multi-tenant
- ✅ Fase 2: Sistema de Atendimento
- ✅ Fase 3: Integrações de Canais
- ✅ Fase 4: Pagamentos
- ✅ Fase 5: Marca Branca
- ✅ Fase 6: Deploy e Infraestrutura
