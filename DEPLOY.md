# 🚀 Guia de Deploy - OmniFlow

Documentação completa para deploy do OmniFlow em produção.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Backend](#configuração-do-backend)
3. [Deploy do Frontend](#deploy-do-frontend)
4. [Configuração via Docker](#configuração-via-docker)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Troubleshooting](#troubleshooting)

---

## 🛠️ Pré-requisitos

### Software Necessário
- **Node.js** 18+ ou Bun
- **Git**
- **Docker** e **Docker Compose** (para produção)
- Conta no **GitHub**
- **VPS** com mínimo 2GB RAM (recomendado 4GB)

### Portas Necessárias
- `80` - HTTP
- `443` - HTTPS
- `3000` - Frontend (desenvolvimento)

---

## 🗄️ 1. Configuração do Backend

### Opção A: Lovable Cloud (Recomendado)

Se você está usando o Lovable, o backend já está configurado automaticamente. O Lovable Cloud inclui:
- Banco de dados PostgreSQL
- Edge Functions
- Storage para arquivos
- Realtime WebSocket
- Autenticação

### Opção B: Supabase Cloud

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Salve as credenciais:
   - `Project URL`
   - `anon public key`
   - `service_role key`

4. Execute as migrations:

```bash
# No seu terminal local
git clone https://github.com/Edton180/omniflow-connect-pay.git
cd omniflow-connect-pay
```

Copie todo o conteúdo de cada arquivo em `supabase/migrations/` e execute no SQL Editor.

---

## 🌐 2. Deploy do Frontend

### Deploy no GitHub Pages

```bash
# Clone o repositório
git clone https://github.com/Edton180/omniflow-connect-pay.git
cd omniflow-connect-pay

# Instale dependências
npm install
# ou
bun install

# Configure as variáveis de ambiente
cp .env.example .env
nano .env
```

Edite `.env`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
VITE_SUPABASE_PROJECT_ID=seu-project-id
```

```bash
# Build para produção
npm run build

# Deploy (configure GitHub Pages para a pasta dist/)
git add .
git commit -m "Deploy production"
git push origin main
```

### Deploy em VPS (Nginx)

```bash
# Na VPS
sudo apt update
sudo apt install nginx nodejs npm -y

# Clone o repositório
cd /var/www/
git clone https://github.com/Edton180/omniflow-connect-pay.git omniflow
cd omniflow

# Instale e build
npm install
npm run build

# Configure Nginx
sudo nano /etc/nginx/sites-available/omniflow
```

Configuração Nginx (`/etc/nginx/sites-available/omniflow`):
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    root /var/www/omniflow/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

```bash
# Ative o site
sudo ln -s /etc/nginx/sites-available/omniflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL com Let's Encrypt (opcional mas recomendado)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seu-dominio.com
```

---

## 🐳 3. Configuração via Docker

### Docker Compose para Frontend

`docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}
    restart: always
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

Inicie:
```bash
docker compose up -d

# Verifique os logs
docker logs frontend -f
```

---

## 🔐 4. Variáveis de Ambiente

### Frontend (.env)

```env
# Lovable Cloud / Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
VITE_SUPABASE_PROJECT_ID=seu-project-id
```

### Secrets (Edge Functions)

Configure os secrets no painel do backend:

```env
# Pagamentos
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
ASAAS_API_KEY=$aact_...

# Mensageria (se necessário)
RESEND_API_KEY=re_...
```

---

## 🔍 5. Testando a Instalação

### Teste o Frontend
```bash
curl https://seu-dominio.com
```

### Verifique SSL
```bash
curl -vI https://seu-dominio.com 2>&1 | grep "SSL"
```

### Teste Edge Functions
```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/test-ai-provider \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"provider": "lovable"}'
```

---

## 🔧 6. Troubleshooting

### Frontend não carrega
```bash
# Verifique os logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Verifique se o build foi feito
ls -la dist/

# Reconstrua se necessário
npm run build
```

### Erro de CORS
Configure no Nginx:
```nginx
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
add_header Access-Control-Allow-Headers "Authorization, Content-Type";
```

### Edge Functions não funcionam
```bash
# Verifique os logs no painel do backend
# Lovable → Backend → Edge Functions → [nome-da-function]
```

---

## 📊 7. Monitoramento

### Logs do Sistema

```bash
# Frontend (Nginx)
sudo tail -f /var/log/nginx/access.log

# Sistema
sudo journalctl -f
```

### Métricas

Use ferramentas como:
- Lovable Analytics
- Google Analytics
- Sentry para erros

---

## 🔄 8. Atualizações

### Atualizar Frontend
```bash
cd /var/www/omniflow
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
```

---

## 📧 Suporte

Para dúvidas ou problemas:
- GitHub Issues: https://github.com/Edton180/omniflow-connect-pay/issues

---

## 📝 Licença

Este projeto está sob a licença definida no arquivo LICENSE.
