# 🚀 Quick Start - OmniFlow

Guia rápido para iniciar com o OmniFlow em menos de 10 minutos.

## 📋 Requisitos

- Node.js 18+ ou Bun
- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Conexão com internet

## ⚡ Instalação Rápida

### Método 1: Lovable (Mais Fácil - Zero Configuração)

1. Acesse o projeto no Lovable
2. Clique em "Fork" para criar sua cópia
3. O sistema já estará funcionando com banco de dados, autenticação e storage configurados
4. Clique em "Share → Publish" para publicar

### Método 2: Desenvolvimento Local

```bash
# 1. Clone o repositório
git clone https://github.com/Edton180/omniflow-connect-pay.git
cd omniflow-connect-pay

# 2. Instale dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev

# 4. Acesse http://localhost:5173
```

### Método 3: Docker (Produção)

```bash
# 1. Clone o repositório
git clone https://github.com/Edton180/omniflow-connect-pay.git
cd omniflow-connect-pay

# 2. Inicie com Docker
docker-compose up -d --build

# 3. Acesse http://localhost:80
```

## 👤 Primeiro Acesso

1. Acesse a aplicação
2. Clique em **"Criar Conta"** ou **"Começar Agora"**
3. Preencha seus dados:
   - Email
   - Senha (mínimo 6 caracteres)
   - Nome completo
4. Confirme a criação da conta
5. **O primeiro usuário será automaticamente Super Admin**

## ⚙️ Configuração Inicial (Super Admin)

Após criar sua conta e fazer login:

### 1. Configurar Landing Page
- Acesse **Dashboard → Editor Landing Page**
- Personalize textos, cores e imagens
- Salve as alterações

### 2. Configurar Branding
- Acesse **Dashboard → Branding**
- Faça upload do logo
- Configure cores primárias e secundárias
- Defina o nome do sistema

### 3. Criar Planos
- Acesse **Dashboard → Planos**
- Clique em **"Novo Plano"**
- Configure:
  - Nome (ex: Básico, Profissional, Enterprise)
  - Preço mensal
  - Limite de usuários
  - Limite de tickets
  - Features incluídas

### 4. Configurar Gateways de Pagamento
- Acesse **Dashboard → Pagamentos**
- Ative os gateways desejados:
  - **Stripe**: Para pagamentos internacionais
  - **Mercado Pago**: Para PIX, cartão e boleto
  - **ASAAS**: Gateway brasileiro completo
  - **PayPal**: Pagamentos globais
- Configure as API keys de cada gateway

### 5. Criar Primeiro Tenant (Empresa)
- Acesse **Dashboard → Gerenciar Tenants**
- Clique em **"Novo Tenant"**
- Preencha:
  - Nome da empresa
  - Slug (URL única)
  - Plano selecionado
- Crie o primeiro usuário admin do tenant

## 📱 Canais de Atendimento

### WhatsApp Business API
1. Configure uma conta no Meta Business
2. Obtenha o access token e phone number ID
3. Em **Canais**, adicione novo canal WhatsApp
4. Configure o webhook URL fornecido

### Telegram
1. Crie um bot no @BotFather
2. Copie o token do bot
3. Em **Canais**, adicione novo canal Telegram
4. O webhook é configurado automaticamente

### Email
1. Em **Canais**, adicione novo canal Email
2. Configure SMTP:
   - Host (ex: smtp.gmail.com)
   - Porta (465 ou 587)
   - Usuário e senha

## 🤖 Configurar IA

O OmniFlow usa **Lovable AI** por padrão, que não requer API key.

Para usar outros provedores:
1. Acesse **Configurações → Chatbot/IA**
2. Selecione o provedor (OpenAI, Google, xAI)
3. Insira a API key
4. Configure o tom e comportamento

## ✅ Checklist de Verificação

- [ ] Conta criada e logado como Super Admin
- [ ] Landing page personalizada
- [ ] Logo e cores configuradas
- [ ] Pelo menos um plano criado
- [ ] Gateway de pagamento configurado
- [ ] Primeiro tenant criado
- [ ] Pelo menos um canal ativo

## 🆘 Problemas Comuns

### "Não consigo criar conta"
- Verifique se o email é válido
- A senha deve ter pelo menos 6 caracteres

### "Página em branco após login"
- Limpe o cache do navegador
- Tente em modo anônimo/privado

### "Erro ao conectar banco de dados"
- Se usando Lovable: já está configurado automaticamente
- Se self-hosted: verifique as variáveis de ambiente

## 📚 Próximos Passos

- [Guia Completo de Instalação](INSTALLATION.md)
- [Deploy em Produção](DEPLOY.md)
- [Configuração de Webhooks](WEBHOOK_SETUP_GUIDE.md)
- [Personalização de Marca](BRANDING_GUIDE.md)

---

**Precisa de ajuda?** Abra uma issue no [GitHub](https://github.com/Edton180/omniflow-connect-pay/issues)
