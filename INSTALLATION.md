# 📦 Guia de Instalação - OmniFlow

Guia completo de instalação do OmniFlow para desenvolvimento e produção.

## 📋 Requisitos Mínimos

### Hardware
- **Desenvolvimento**: 4GB RAM, 10GB disco
- **Produção**: 8GB RAM, 50GB disco SSD, 2 vCPUs

### Software
- Node.js 18+ ou Bun
- PostgreSQL 14+ (ou conta Supabase Cloud)
- Docker 20.10+ e Docker Compose
- Git 2.30+
- Nginx (para produção)

---

## 🚀 Instalação Rápida (Desenvolvimento)

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/omniflow.git
cd omniflow

# Instale dependências
npm install
# ou
bun install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# Inicie o servidor de desenvolvimento
npm run dev
# ou
bun dev
```

Acesse: `http://localhost:5173`

---

## 🏢 Instalação para Produção

### 1. Clone e Prepare o Projeto

```bash
# Na sua VPS
ssh usuario@seu-servidor

# Atualize o sistema
sudo apt update && sudo apt upgrade -y

# Instale dependências do sistema
sudo apt install -y git nginx postgresql-client curl

# Instale Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Clone o projeto
cd /var/www
sudo git clone https://github.com/seu-usuario/omniflow.git
sudo chown -R $USER:$USER omniflow
cd omniflow
```

### 2. Configure o Banco de Dados

#### Opção A: Supabase Cloud (Recomendado)

1. Crie conta em [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Copie as credenciais
4. Execute as migrations:

```bash
# Instale Supabase CLI
npm install -g supabase

# Faça login
supabase login

# Link ao projeto
supabase link --project-ref seu-project-ref

# Execute migrations
supabase db push
```

#### Opção B: PostgreSQL Local

```bash
# Instale PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Crie banco de dados
sudo -u postgres createdb omniflow
sudo -u postgres createuser omniflow_user -P

# Execute migrations
psql -U omniflow_user -d omniflow -f supabase/migrations/*.sql
```

### 3. Configure Evolution API

```bash
# Crie diretório
sudo mkdir -p /opt/evolution-api
cd /opt/evolution-api

# Crie docker-compose.yml
sudo nano docker-compose.yml
```

Cole este conteúdo:

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
      - SERVER_URL=https://api.seu-dominio.com
      - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=${DATABASE_URI}
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://redis:6379
      - LOG_LEVEL=ERROR
    volumes:
      - evolution_data:/evolution/instances
    networks:
      - evolution

  redis:
    image: redis:alpine
    container_name: evolution-redis
    restart: always
    volumes:
      - redis_data:/data
    networks:
      - evolution

volumes:
  evolution_data:
  redis_data:

networks:
  evolution:
    driver: bridge
```

Crie `.env`:
```bash
sudo nano .env
```

```env
EVOLUTION_API_KEY=GERE_UM_TOKEN_FORTE_AQUI_MIN_32_CHARS
DATABASE_URI=postgresql://usuario:senha@localhost:5432/evolution
```

Inicie:
```bash
sudo docker compose up -d
```

### 4. Configure o Frontend

```bash
cd /var/www/omniflow

# Configure variáveis
nano .env
```

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
VITE_SUPABASE_PROJECT_ID=seu-project-id
```

```bash
# Build para produção
npm run build
```

### 5. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/omniflow
```

```nginx
# Frontend
server {
    listen 80;
    server_name seu-dominio.com;

    root /var/www/omniflow/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Evolution API
server {
    listen 80;
    server_name api.seu-dominio.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Ative os sites
sudo ln -s /etc/nginx/sites-available/omniflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Configure SSL (Let's Encrypt)

```bash
# Instale Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtenha certificados
sudo certbot --nginx -d seu-dominio.com -d api.seu-dominio.com

# Renovação automática já está configurada
sudo certbot renew --dry-run
```

---

## 🔐 Configuração de Segurança

### Firewall (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Fail2Ban (Proteção contra brute force)

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 👤 Setup Inicial do Sistema

### 1. Primeiro Acesso

1. Acesse `https://seu-dominio.com`
2. Clique em **Criar Conta**
3. Preencha seus dados
4. Um botão aparecerá para configurar como Super Admin

### 2. Configure Evolution API

1. No painel do Super Admin, vá em **Configurações do Sistema**
2. Configure os secrets do Supabase:
   - `EVOLUTION_API_URL`: `https://api.seu-dominio.com`
   - `EVOLUTION_API_KEY`: (o mesmo token que você configurou no docker-compose)

### 3. Crie Seu Primeiro Tenant

1. Vá em **Gerenciar Tenants**
2. Clique em **Novo Tenant**
3. Preencha os dados da empresa
4. Configure o plano e limites

### 4. Crie Usuários

1. Vá em **Gerenciar Usuários**
2. Crie usuários para o tenant
3. Atribua filas de atendimento

### 5. Configure Canais

1. Vá em **Canais**
2. Crie um canal **Evolution API**
3. Conecte seu WhatsApp

---

## 🔄 Scripts de Manutenção

### Backup Automático

```bash
# Crie script de backup
sudo nano /usr/local/bin/backup-omniflow.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/omniflow"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup banco
pg_dump -U usuario omniflow > "$BACKUP_DIR/db_$DATE.sql"

# Backup Evolution API data
docker exec evolution-api tar czf - /evolution/instances > "$BACKUP_DIR/evolution_$DATE.tar.gz"

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Torne executável
sudo chmod +x /usr/local/bin/backup-omniflow.sh

# Agende com cron (diário às 3h)
sudo crontab -e
# Adicione:
0 3 * * * /usr/local/bin/backup-omniflow.sh
```

### Monitoramento com PM2

```bash
# Instale PM2
sudo npm install -g pm2

# Para monitorar Evolution API logs
pm2 start "docker logs evolution-api -f" --name evolution-logs
pm2 save
pm2 startup
```

---

## 📊 Verificação da Instalação

### Checklist Completo

- [ ] Frontend acessível em `https://seu-dominio.com`
- [ ] Login funciona corretamente
- [ ] Super Admin consegue acessar painel
- [ ] Evolution API responde em `https://api.seu-dominio.com/health`
- [ ] Consegue criar tenant
- [ ] Consegue criar usuário
- [ ] Consegue criar canal Evolution API
- [ ] QR Code aparece e conecta
- [ ] SSL configurado (HTTPS)
- [ ] Firewall configurado
- [ ] Backups automáticos configurados

### Testes Rápidos

```bash
# Teste frontend
curl -I https://seu-dominio.com

# Teste Evolution API
curl https://api.seu-dominio.com/health

# Teste banco
psql postgresql://usuario:senha@localhost:5432/omniflow -c "SELECT count(*) FROM tenants;"

# Teste Redis
docker exec evolution-redis redis-cli ping
```

---

## 🆘 Troubleshooting Comum

### Problema: "Cannot connect to Evolution API"
**Solução**:
```bash
# Verifique se está rodando
docker ps

# Veja os logs
docker logs evolution-api -f

# Reinicie
docker restart evolution-api
```

### Problema: "QR Code não aparece"
**Solução**:
- Verifique se EVOLUTION_API_URL está configurado corretamente no Supabase
- Verifique se a instância foi criada: `docker logs evolution-api`
- Teste manualmente: `curl https://api.seu-dominio.com/instance/fetchInstances -H "apikey: seu-token"`

### Problema: "Failed to load channels"
**Solução**:
- Verifique RLS policies no Supabase
- Confira se o usuário tem tenant_id configurado
- Veja logs do navegador (F12)

### Problema: Nginx 502 Bad Gateway
**Solução**:
```bash
# Verifique se o build existe
ls -la /var/www/omniflow/dist

# Reconstrua
cd /var/www/omniflow
npm run build

# Reinicie Nginx
sudo systemctl restart nginx
```

---

## 📞 Suporte

- **Documentação**: `/DEPLOY.md`
- **Issues**: https://github.com/seu-usuario/omniflow/issues
- **Evolution API Docs**: https://doc.evolution-api.com

---

## 🎉 Próximos Passos

Após instalação:

1. ✅ Configure sua marca branca no painel
2. ✅ Customize a landing page
3. ✅ Configure planos e preços
4. ✅ Integre gateways de pagamento
5. ✅ Convide sua equipe
6. ✅ Comece a atender!

**OmniFlow está pronto para uso!** 🚀
