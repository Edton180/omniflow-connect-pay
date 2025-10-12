# 🚀 Guia de Deploy - OmniFlow

Documentação completa para deploy do OmniFlow em produção.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Supabase](#configuração-do-supabase)
3. [Deploy do Frontend](#deploy-do-frontend)
4. [Deploy do Evolution API](#deploy-do-evolution-api)
5. [Configuração via Docker/Portainer](#configuração-via-dockerportainer)
6. [Variáveis de Ambiente](#variáveis-de-ambiente)
7. [Troubleshooting](#troubleshooting)

---

## 🛠️ Pré-requisitos

### Software Necessário
- **Node.js** 18+ ou Bun
- **Git**
- **Docker** e **Docker Compose** (para Evolution API)
- **PostgreSQL** 14+ (ou conta Supabase)
- Conta no **GitHub**
- **VPS** com mínimo 2GB RAM (recomendado 4GB)

### Portas Necessárias
- `3000` - Frontend (React/Vite)
- `5432` - PostgreSQL (Supabase)
- `8080` - Evolution API
- `9000` - Portainer (opcional)

---

## 🗄️ 1. Configuração do Supabase

### Opção A: Supabase Cloud (Recomendado para Começar)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Salve as credenciais:
   - `Project URL`
   - `anon public key`
   - `service_role key`

4. Execute as migrations no SQL Editor:

```bash
# No seu terminal local
git clone https://github.com/seu-usuario/omniflow.git
cd omniflow
```

Copie todo o conteúdo de cada arquivo em `supabase/migrations/` e execute no SQL Editor do Supabase.

### Opção B: Self-Hosted Supabase

```bash
# Clone o repositório do Supabase
git clone --depth 1 https://github.com/supabase/supabase

# Entre no diretório docker
cd supabase/docker

# Copie o arquivo de exemplo
cp .env.example .env

# Edite as variáveis
nano .env

# Inicie os serviços
docker compose up -d
```

---

## 🌐 2. Deploy do Frontend

### Deploy no GitHub Pages

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/omniflow.git
cd omniflow

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
git clone https://github.com/seu-usuario/omniflow.git
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

## 📱 3. Deploy do Evolution API

### Método 1: Docker Compose (Recomendado)

Crie `docker-compose-evolution.yml`:

```yaml
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:v2.1.1
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      # Configurações Básicas
      - SERVER_URL=https://api.seu-dominio.com
      - AUTHENTICATION_API_KEY=seu-token-secreto-aqui-min-32-chars
      
      # Database (PostgreSQL recomendado para produção)
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://usuario:senha@localhost:5432/evolution
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      
      # Cache (Redis recomendado para produção)
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://redis:6379
      - CACHE_REDIS_PREFIX_KEY=evolution
      
      # Storage (S3 para produção, local para desenvolvimento)
      - S3_ENABLED=false
      
      # Configurações WhatsApp
      - CONFIG_SESSION_PHONE_CLIENT=OmniFlow
      - CONFIG_SESSION_PHONE_NAME=Chrome
      
      # Webhooks
      - WEBHOOK_GLOBAL_ENABLED=false
      - WEBHOOK_GLOBAL_URL=https://seu-dominio.com/webhook
      
      # Logs
      - LOG_LEVEL=ERROR
      - LOG_COLOR=true
      
      # Outras configurações
      - DEL_INSTANCE=false
      - DEL_TEMP_INSTANCES=true
    volumes:
      - evolution_data:/evolution/instances
    networks:
      - evolution-network

  redis:
    image: redis:latest
    container_name: evolution-redis
    restart: always
    command: >
      redis-server
      --appendonly yes
      --port 6379
    volumes:
      - redis_data:/data
    networks:
      - evolution-network

volumes:
  evolution_data:
  redis_data:

networks:
  evolution-network:
    driver: bridge
```

Inicie:
```bash
docker compose -f docker-compose-evolution.yml up -d

# Verifique os logs
docker logs evolution-api -f
```

### Método 2: Portainer

1. **Instale o Portainer**:
```bash
docker volume create portainer_data
docker run -d -p 9000:9000 -p 9443:9443 \
  --name=portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

2. Acesse `http://seu-servidor:9000`
3. Crie admin user
4. Conecte ao Docker local
5. No menu **Stacks**, crie novo stack
6. Cole o conteúdo do `docker-compose-evolution.yml`
7. Clique em **Deploy the stack**

### Método 3: Instalação Manual

```bash
# Clone o repositório
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Copie e edite variáveis de ambiente
cp .env.example .env
nano .env

# Instale dependências
npm install

# Build
npm run build

# Inicie com PM2
npm install -g pm2
pm2 start dist/src/main.js --name evolution-api
pm2 startup
pm2 save
```

---

## 🔐 4. Variáveis de Ambiente

### Frontend (.env)

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
VITE_SUPABASE_PROJECT_ID=seu-project-id

# Evolution API (opcional se usar integração)
VITE_EVOLUTION_API_URL=https://api.seu-dominio.com
```

### Evolution API (.env)

```env
# API Configuration
SERVER_URL=https://api.seu-dominio.com
AUTHENTICATION_API_KEY=gere-token-forte-min-32-caracteres

# Database
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://user:pass@localhost:5432/evolution

# Cache
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://localhost:6379

# WhatsApp
CONFIG_SESSION_PHONE_CLIENT=OmniFlow
CONFIG_SESSION_PHONE_NAME=Chrome
```

### Supabase Secrets

Configure no dashboard do Supabase em **Settings > Edge Functions**:

```env
EVOLUTION_API_URL=https://api.seu-dominio.com
EVOLUTION_API_KEY=seu-token-secreto
```

---

## 🔍 5. Testando a Instalação

### Teste o Frontend
```bash
curl https://seu-dominio.com
```

### Teste o Evolution API
```bash
curl -X GET https://api.seu-dominio.com/health \
  -H "apikey: seu-token-secreto"
```

### Teste criar instância
```bash
curl -X POST https://api.seu-dominio.com/instance/create \
  -H "apikey: seu-token-secreto" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "teste",
    "qrcode": true
  }'
```

---

## 🐳 6. Docker Compose Completo (Frontend + Evolution API)

`docker-compose.full.yml`:

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}
    networks:
      - app-network

  # Evolution API
  evolution-api:
    image: atendai/evolution-api:v2.1.1
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=${EVOLUTION_SERVER_URL}
      - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=${DATABASE_URI}
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://redis:6379
    depends_on:
      - redis
    volumes:
      - evolution_data:/evolution/instances
    networks:
      - app-network

  # Redis
  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data
    networks:
      - app-network

volumes:
  evolution_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

Inicie tudo:
```bash
docker compose -f docker-compose.full.yml up -d
```

---

## 🔧 7. Troubleshooting

### Frontend não carrega
```bash
# Verifique os logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Verifique se o build foi feito
ls -la dist/

# Reconstrua se necessário
npm run build
```

### Evolution API não conecta
```bash
# Veja os logs
docker logs evolution-api -f

# Verifique se está rodando
docker ps

# Reinicie se necessário
docker restart evolution-api
```

### Erro de CORS
Configure no Nginx:
```nginx
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
add_header Access-Control-Allow-Headers "Authorization, Content-Type";
```

### Banco de dados não conecta
```bash
# Teste a conexão
psql postgresql://user:pass@localhost:5432/evolution

# Verifique se o PostgreSQL está rodando
sudo systemctl status postgresql
```

---

## 📊 8. Monitoramento

### Logs do Sistema

```bash
# Frontend (Nginx)
sudo tail -f /var/log/nginx/access.log

# Evolution API
docker logs evolution-api -f --tail 100

# Sistema
sudo journalctl -f
```

### Métricas com Portainer
- Acesse Portainer em `http://seu-servidor:9000`
- Visualize CPU, RAM, Network de cada container
- Configure alertas de recursos

---

## 🔄 9. Atualizações

### Atualizar Frontend
```bash
cd /var/www/omniflow
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
```

### Atualizar Evolution API
```bash
docker pull atendai/evolution-api:latest
docker compose -f docker-compose-evolution.yml up -d
```

---

## 📧 Suporte

Para dúvidas ou problemas:
- GitHub Issues: https://github.com/seu-usuario/omniflow/issues
- Documentação Evolution API: https://doc.evolution-api.com

---

## 📝 Licença

Este projeto está sob a licença definida no arquivo LICENSE.
