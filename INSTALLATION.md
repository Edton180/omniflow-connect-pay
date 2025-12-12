# 📦 Guia de Instalação - OmniFlow

Guia completo de instalação do OmniFlow para desenvolvimento e produção.

## 📋 Requisitos Mínimos

### Para VPS/Servidor
- Ubuntu 20.04+ ou CentOS 7+
- 8GB RAM (mínimo 4GB)
- 50GB de armazenamento SSD
- 2 vCPUs
- Acesso root (sudo)

### Para Desenvolvimento Local
- Node.js 18+ ou Bun
- 4GB RAM disponível
- 10GB de espaço em disco

### Para cPanel/Hospedagem Compartilhada
- Node.js 18+ (via cPanel Node.js Selector)
- 2GB de espaço em disco
- Acesso ao terminal SSH (recomendado)

---

## 🚀 Instalação Rápida (Recomendado)

### Instalador Automático

O OmniFlow possui um instalador automático que facilita a instalação em diferentes ambientes:

```bash
# Download e execute o instalador
curl -sSL https://raw.githubusercontent.com/omniflow-app/omniflow/main/scripts/auto-install.sh | sudo bash
```

**O instalador oferece 4 opções:**

1. **VPS** - Instalação completa em servidor dedicado/VPS
   - Instala Docker, Node.js, Nginx, SSL
   - Configura backups automáticos
   - Instala firewall

2. **cPanel** - Guia passo a passo para hospedagem compartilhada
   - Instruções detalhadas para upload
   - Configuração de .htaccess
   - Setup de variáveis de ambiente

3. **Localhost** - Ambiente de desenvolvimento local
   - Instalação rápida para desenvolvimento
   - Servidor de desenvolvimento com hot-reload

4. **VirtualBox** - Instalação em máquina virtual
   - Ideal para testes e homologação
   - Configuração completa incluída

### O que o instalador faz automaticamente:

- ✅ Detecta seu sistema operacional
- ✅ Instala todas as dependências necessárias
- ✅ Configura Docker e Docker Compose
- ✅ Instala e configura Nginx com SSL
- ✅ Configura firewall (UFW/Firewalld)
- ✅ Cria scripts de backup automático
- ✅ Configura domínio e certificado SSL

---

## 🖥️ Instalação Manual em VPS

```bash
# Clone o repositório
git clone https://github.com/omniflow-app/omniflow.git
cd omniflow

# Instale dependências
npm install
# ou
bun install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Inicie o servidor de desenvolvimento
npm run dev
# ou
bun dev
```

---

## 🌐 Instalação em cPanel (Hospedagem Compartilhada)

### Pré-requisitos
- Acesso ao cPanel com Node.js Selector
- Domínio configurado
- SSL ativo (Let's Encrypt gratuito via cPanel)

### Passo 1: Prepare os Arquivos

```bash
# No seu computador local
git clone https://github.com/omniflow-app/omniflow.git
cd omniflow

# Instale dependências e faça o build
npm install
npm run build

# O resultado estará na pasta 'dist'
```

### Passo 2: Upload via cPanel File Manager

1. Acesse seu cPanel
2. Vá em **File Manager**
3. Navegue até `public_html` (ou subdomínio desejado)
4. Faça upload de todos os arquivos da pasta `dist`

### Passo 3: Configure o .htaccess

Crie um arquivo `.htaccess` na raiz com:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Compressão Gzip
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>

# Cache de assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### Passo 4: Configure Variáveis de Ambiente

Como você está usando Lovable Cloud, as variáveis já estão embutidas no build. Não precisa configurar nada adicional!

### Passo 5: Ative SSL

1. No cPanel, vá em **SSL/TLS Status**
2. Clique em **Run AutoSSL** ou configure Let's Encrypt

---

## 💻 Instalação em Localhost (Desenvolvimento)

### Opção A: Via Lovable (Mais Fácil)

Simplesmente acesse o projeto no Lovable:
```
https://lovable.dev/projects/bdc96e6e-0aab-497c-8a71-bacaedb7aa56
```

### Opção B: Clone Local

```bash
# 1. Clone o repositório
git clone https://github.com/omniflow-app/omniflow.git
cd omniflow

# 2. Instale dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev

# 4. Acesse http://localhost:5173
```

### Opção C: Com Docker

```bash
# 1. Clone o repositório
git clone https://github.com/omniflow-app/omniflow.git
cd omniflow

# 2. Inicie com Docker Compose
docker-compose up -d

# 3. Acesse http://localhost:80
```

---

## 🗄️ Configuração do Banco de Dados

### Opção A: Lovable Cloud (Recomendado)

Se você está usando o Lovable, o banco de dados já está configurado automaticamente. Não precisa fazer nada!

### Opção B: Supabase Cloud

1. Crie conta em [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Copie as credenciais:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Configure no `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon
VITE_SUPABASE_PROJECT_ID=seu-project-id
```

### Opção C: PostgreSQL Local (Avançado)

⚠️ **Nota**: Esta opção requer conhecimento avançado e não é recomendada para iniciantes.

```bash
# 1. Instale PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 2. Crie banco de dados
sudo -u postgres createdb omniflow
sudo -u postgres createuser omniflow_user -P

# 3. Execute as migrations manualmente
# Você precisará extrair o SQL das migrations
```

---

## 🔧 Instalação em VPS Completa

### Passo 1: Prepare o Servidor

```bash
# Conecte via SSH
ssh root@seu-servidor

# Atualize o sistema
apt update && apt upgrade -y

# Instale dependências básicas
apt install -y git curl wget nginx
```

### Passo 2: Instale Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
```

### Passo 3: Clone e Configure

```bash
cd /var/www
git clone https://github.com/omniflow-app/omniflow.git
cd omniflow

# Instale dependências
npm install

# Configure ambiente (se não usar Lovable Cloud)
cp .env.example .env
nano .env

# Build para produção
npm run build
```

### Passo 4: Configure Nginx

```bash
nano /etc/nginx/sites-available/omniflow
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    root /var/www/omniflow/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Compressão
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Cache de assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Ative o site
ln -s /etc/nginx/sites-available/omniflow /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Passo 5: Configure SSL

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d seu-dominio.com
```

---

## 👤 Setup Inicial do Sistema

### 1. Primeiro Acesso

1. Acesse `https://seu-dominio.com`
2. Clique em **Criar Conta** ou **Começar Agora**
3. Preencha seus dados (email, senha e nome completo)
4. Você será automaticamente redirecionado para a página de **Setup**
5. Clique em **Complete Setup** para ser configurado como **Super Admin**

### 2. Configure a Plataforma (Super Admin)

1. No painel Super Admin, configure:
   - **Landing Page**: Edite textos, cores e imagens
   - **Branding**: Logo e cores da marca
   - **Planos**: Configure planos e preços
   - **Gateways**: Configure gateways de pagamento

### 3. Crie Seu Primeiro Tenant

1. Vá em **Gerenciar Tenants**
2. Clique em **Novo Tenant**
3. Preencha os dados da empresa
4. Configure o plano e limites

---

## 🔄 Manutenção e Atualizações

### Atualizar o Sistema

```bash
cd /var/www/omniflow
git pull origin main
npm install
npm run build
```

### Backup Automático

```bash
# Crie script de backup
nano /usr/local/bin/backup-omniflow.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/omniflow"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar czf "$BACKUP_DIR/app_$DATE.tar.gz" /var/www/omniflow/dist

# Manter últimos 7 dias
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
chmod +x /usr/local/bin/backup-omniflow.sh

# Agendar backup diário
crontab -e
# Adicione: 0 3 * * * /usr/local/bin/backup-omniflow.sh
```

---

## 🆘 Troubleshooting

### Problema: Página em branco

**Causa**: Build não foi feito ou arquivos não foram enviados corretamente.

**Solução**:
```bash
npm run build
# Verifique se a pasta dist foi criada
ls -la dist/
```

### Problema: Erro 404 em rotas

**Causa**: Servidor não está configurado para SPA.

**Solução**: Configure o `.htaccess` (Apache) ou nginx para redirecionar para `index.html`.

### Problema: "Cannot connect to database"

**Causa**: Credenciais incorretas.

**Solução**: Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estão corretas.

### Problema: Erro de CORS

**Causa**: Domínio não autorizado.

**Solução**: 
1. Acesse o dashboard do backend
2. Vá em Settings → API
3. Adicione seu domínio em "Allowed Origins"

### Problema: SSL não funciona

**Causa**: Certificado não foi configurado.

**Solução**:
```bash
certbot --nginx -d seu-dominio.com
certbot renew --dry-run
```

---

## 📊 Verificação da Instalação

### Checklist Completo

- [ ] Frontend acessível
- [ ] Login funciona corretamente
- [ ] Dashboard carrega métricas
- [ ] Super Admin consegue acessar painel
- [ ] Landing page aparece corretamente
- [ ] SSL configurado (HTTPS)
- [ ] Favicon aparece na aba do navegador

### Testes Rápidos

```bash
# Teste se o site está acessível
curl -I https://seu-dominio.com

# Teste se o SSL está funcionando
curl -vI https://seu-dominio.com 2>&1 | grep "SSL"
```

---

## 📞 Suporte

Se você encontrar problemas durante a instalação:

1. Verifique a seção de Troubleshooting acima
2. Consulte a documentação completa em [DEPLOY.md](DEPLOY.md)
3. Abra uma issue no GitHub

---

**Boa sorte com sua instalação! 🚀**
