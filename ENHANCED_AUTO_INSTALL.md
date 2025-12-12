# 🚀 OmniFlow - Auto Instalador Completo

Script de instalação automatizada para múltiplas plataformas.

## 📥 Instalação Rápida

```bash
# Execute o instalador automático
curl -sSL https://raw.githubusercontent.com/omniflow-app/omniflow/main/scripts/auto-install.sh | sudo bash
```

## 🎯 Opções de Instalação

O instalador oferece 4 opções:

### 1️⃣ VPS - Instalação Completa em Servidor

Ideal para produção com domínio próprio.

**O que será instalado:**
- ✅ Docker & Docker Compose
- ✅ Node.js 18 LTS
- ✅ Nginx (proxy reverso)
- ✅ SSL (Let's Encrypt)
- ✅ Firewall configurado
- ✅ Backups automáticos

**Requisitos:**
- Ubuntu 20.04+ ou Debian 11+
- Mínimo 4GB RAM
- 20GB disco
- Domínio apontado para o IP do servidor

### 2️⃣ cPanel - Hospedagem Compartilhada

Para quem já tem hospedagem cPanel.

**Passos:**
1. Build local com `npm run build`
2. Upload da pasta `dist/` para `public_html`
3. Configurar `.htaccess`
4. Adicionar variáveis de ambiente

Veja: [MANUAL_INSTALL_CPANEL.md](./MANUAL_INSTALL_CPANEL.md)

### 3️⃣ Localhost - Desenvolvimento Local

Para desenvolvedores.

**O que faz:**
- ✅ Clona o repositório
- ✅ Instala dependências
- ✅ Configura `.env`
- ✅ Pronto para `npm run dev`

### 4️⃣ VirtualBox - Máquina Virtual

Para testes e homologação.

**O que inclui:**
- ✅ Instalação completa (igual VPS)
- ✅ Otimizado para VM
- ✅ Suporte a snapshots
- ✅ Compartilhamento de pastas

Veja: [MANUAL_INSTALL_VIRTUALBOX.md](./MANUAL_INSTALL_VIRTUALBOX.md)

---

## 🔧 Configuração Pós-Instalação

Após a instalação, acesse o sistema:

```
https://seu-dominio.com
```

### 1️⃣ Primeiro Acesso - Super Admin

1. Faça login com suas credenciais
2. Complete o setup do Super Admin
3. O sistema criará automaticamente:
   - ✅ Perfil de Super Admin
   - ✅ Permissões completas

### 2️⃣ Configurar Canais de Atendimento

No menu Super Admin:

1. Acesse **Canais**
2. Clique em **Novo Canal**
3. Selecione o tipo de canal desejado:
   - WhatsApp Business API
   - Telegram
   - Instagram
   - Facebook Messenger
   - WebChat
   - Email
4. Configure as credenciais necessárias

### 3️⃣ Criar Primeira Empresa (Tenant)

1. Acesse **Gerenciar Tenants**
2. Clique em **Novo Tenant**
3. Preencha:
   - Nome da empresa
   - Slug único (ex: `empresa1`)
   - Email do admin
   - Senha inicial
   - Limites (usuários, tickets)

### 4️⃣ Configurar Gateways de Pagamento

1. Faça login como Tenant Admin
2. Acesse **Pagamentos** → **Gateways**
3. Configure suas credenciais:
   - ASAAS
   - Mercado Pago
   - Stripe
   - InfinitePay

---

## 🎨 Personalização

### Marca Branca

Super Admin pode customizar:
- Logo do sistema
- Cores primárias e secundárias
- Nome do sistema
- Landing page

Acesse: **Super Admin** → **Marca Branca**

### Domínio Customizado

Configure em: **Super Admin** → **Configurações** → **Domínio Customizado**

Aponte seu domínio (registro A) para o IP exibido no painel.

---

## 🔐 Segurança

### Firewall Configurado

```bash
# Portas abertas automaticamente:
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
```

### SSL Automático

Let's Encrypt é configurado automaticamente para:
- Domínio principal
- Subdomínios (se configurados)
- Renovação automática

### Backups Automáticos

Script roda diariamente às 3h da manhã:
- Backup de arquivos da aplicação
- Retenção de 7 dias

Local dos backups: `/backups/omniflow/`

---

## 🔄 Atualizações

### Atualização Automática

```bash
cd /opt/omniflow
git pull origin main
npm install
npm run build
sudo systemctl restart nginx
```

### Via Script

```bash
sudo /opt/omniflow/scripts/update.sh
```

---

## 🐛 Troubleshooting

### Erro: "Nginx failed to start"

```bash
sudo nginx -t  # Testar configuração
sudo tail -f /var/log/nginx/error.log  # Ver logs
```

### Erro: "Docker not found"

```bash
sudo systemctl status docker
sudo systemctl start docker
```

### Erro: "Connection failed"

Verifique no arquivo `.env`:
- `VITE_SUPABASE_URL` está correto
- `VITE_SUPABASE_PUBLISHABLE_KEY` está correto
- Conexão com internet funciona

---

## 📊 Monitoramento

### Ver Logs do Sistema

```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs do sistema
journalctl -u nginx -f
```

### Verificar Status dos Serviços

```bash
# Nginx
sudo systemctl status nginx

# Docker
sudo systemctl status docker
```

---

## 🗄️ Backup e Restauração

### Backup Manual

```bash
sudo /usr/local/bin/backup-omniflow.sh
```

### Restaurar Backup

```bash
# Listar backups disponíveis
ls -lh /backups/omniflow/

# Restaurar
cd /
sudo tar xzf /backups/omniflow/omniflow_YYYYMMDD_HHMMSS.tar.gz

# Reiniciar serviços
sudo systemctl restart nginx
```

---

## 🌐 Configuração de DNS

Para seu domínio funcionar, configure no seu registrador:

### Registro A (Principal)
```
Type: A
Name: @
Value: [IP_DO_SERVIDOR]
TTL: 3600
```

### Registro A (WWW)
```
Type: A
Name: www
Value: [IP_DO_SERVIDOR]
TTL: 3600
```

### Registro A (API - Optional)
```
Type: A
Name: api
Value: [IP_DO_SERVIDOR]
TTL: 3600
```

**Tempo de Propagação:** 4-48 horas

---

## 💰 Gateways de Pagamento

### ASAAS

1. Crie conta em: https://www.asaas.com
2. Acesse: Configurações → Integrações
3. Copie sua API Key
4. Cole em: Pagamentos → ASAAS

### Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers
2. Crie uma aplicação
3. Copie Public Key e Access Token
4. Configure em: Pagamentos → Mercado Pago

### Stripe

1. Acesse: https://dashboard.stripe.com
2. Developers → API keys
3. Copie Publishable key e Secret key
4. Configure em: Pagamentos → Stripe

---

## 🆘 Suporte

**Documentação Completa:**
- [Instalação](./INSTALLATION.md)
- [cPanel](./MANUAL_INSTALL_CPANEL.md)
- [VirtualBox](./MANUAL_INSTALL_VIRTUALBOX.md)
- [Sistema de Billing](./BILLING_SYSTEM.md)

**Comunidade:**
- GitHub Issues: https://github.com/omniflow-app/omniflow/issues

---

## ✅ Checklist Pós-Instalação

- [ ] Sistema acessível via navegador
- [ ] SSL/HTTPS funcionando
- [ ] Primeiro Super Admin criado
- [ ] Canais de atendimento configurados
- [ ] Primeiro Tenant criado
- [ ] Gateway de pagamento ativo
- [ ] Marca branca personalizada
- [ ] Backup automático funcionando
- [ ] DNS propagado e funcionando

---

**🎉 OmniFlow instalado e pronto para uso!**
