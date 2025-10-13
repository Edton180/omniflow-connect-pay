# Guia Completo de Instalação do OmniFlow

Este guia detalha todas as formas possíveis de instalação do OmniFlow, incluindo configurações com e sem Supabase.

## Índice

1. [Requisitos do Sistema](#requisitos-do-sistema)
2. [Instalação Local (Desenvolvimento)](#instalação-local-desenvolvimento)
3. [Instalação em VirtualBox](#instalação-em-virtualbox)
4. [Instalação em VPS (Produção)](#instalação-em-vps-produção)
5. [Instalação com Docker](#instalação-com-docker)
6. [Instalação sem Supabase](#instalação-sem-supabase)
7. [Auto-Instalador](#auto-instalador)
8. [Configuração Pós-Instalação](#configuração-pós-instalação)
9. [Troubleshooting](#troubleshooting)

---

## Requisitos do Sistema

### Mínimos
- **CPU**: 2 cores
- **RAM**: 4GB
- **Disco**: 20GB SSD
- **SO**: Ubuntu 20.04+, Debian 10+, CentOS 8+, Windows 10+, macOS 10.15+

### Recomendados para Produção
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Disco**: 50GB+ SSD
- **SO**: Ubuntu 22.04 LTS

### Dependências
- Node.js 18+ 
- npm ou yarn
- Git
- PostgreSQL 14+ (se não usar Supabase)
- Nginx (para produção)
- PM2 (para gerenciamento de processos)
- SSL/TLS certificates (Let's Encrypt recomendado)

---

## Instalação Local (Desenvolvimento)

### Com Supabase (Recomendado)

#### Passo 1: Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/omniflow.git
cd omniflow
```

#### Passo 2: Instalar Dependências
```bash
npm install
# ou
yarn install
```

#### Passo 3: Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase Config (obtenha em https://app.supabase.com)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
VITE_SUPABASE_PROJECT_ID=seu-projeto-id

# Opcional: Configurações adicionais
VITE_APP_NAME=OmniFlow
VITE_APP_URL=http://localhost:5173
```

#### Passo 4: Executar Migrações do Supabase
```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Link com seu projeto
supabase link --project-ref seu-projeto-id

# Executar migrações
supabase db push
```

#### Passo 5: Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
# ou
yarn dev
```

O aplicativo estará disponível em `http://localhost:5173`

### Sem Supabase

#### Passo 1-2: Mesmos da instalação com Supabase

#### Passo 3: Instalar e Configurar PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Criar banco de dados
sudo -u postgres psql
CREATE DATABASE omniflow;
CREATE USER omniflow_user WITH PASSWORD 'senha_segura';
GRANT ALL PRIVILEGES ON DATABASE omniflow TO omniflow_user;
\q
```

#### Passo 4: Configurar Variáveis de Ambiente
```env
# Database Config
DATABASE_URL=postgresql://omniflow_user:senha_segura@localhost:5432/omniflow

# JWT Config
JWT_SECRET=sua-chave-secreta-jwt-muito-segura
JWT_EXPIRATION=7d

# App Config
VITE_APP_NAME=OmniFlow
VITE_APP_URL=http://localhost:5173
API_URL=http://localhost:3000
```

#### Passo 5: Executar Migrações
```bash
npm run migrate
```

#### Passo 6: Iniciar Backend e Frontend
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev
```

---

## Instalação em VirtualBox

### Preparação da VM

#### Passo 1: Criar Nova VM
- **Nome**: OmniFlow
- **Tipo**: Linux
- **Versão**: Ubuntu (64-bit)
- **Memória RAM**: 4096 MB (mínimo) / 8192 MB (recomendado)
- **Disco**: 50 GB VDI, dinamicamente alocado
- **CPUs**: 2+ cores
- **Rede**: Bridge Adapter (para acesso externo) ou NAT com Port Forwarding

#### Passo 2: Port Forwarding (se usar NAT)
```
Nome: HTTP
Protocolo: TCP
IP Host: 127.0.0.1
Porta Host: 8080
IP Convidado: (deixe em branco)
Porta Convidado: 80

Nome: HTTPS
Protocolo: TCP
IP Host: 127.0.0.1
Porta Host: 8443
Porta Convidado: 443

Nome: SSH
Protocolo: TCP
Porta Host: 2222
Porta Convidado: 22
```

#### Passo 3: Instalar Ubuntu Server
- Baixe Ubuntu Server 22.04 LTS
- Monte o ISO na VM
- Siga o instalador padrão
- Configure SSH durante instalação
- Crie usuário: `omniflow`

### Instalação do OmniFlow na VM

#### Passo 1: Atualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

#### Passo 2: Instalar Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verificar instalação
```

#### Passo 3: Clonar e Configurar
```bash
cd /home/omniflow
git clone https://github.com/seu-usuario/omniflow.git
cd omniflow
npm install
```

#### Passo 4: Configurar .env
```bash
cp .env.example .env
nano .env
# Configure as variáveis conforme necessário
```

#### Passo 5: Instalar PM2 e Nginx
```bash
sudo npm install -g pm2
sudo apt install -y nginx

# Configurar PM2
pm2 start npm --name "omniflow" -- start
pm2 startup
pm2 save
```

#### Passo 6: Configurar Nginx
```bash
sudo nano /etc/nginx/sites-available/omniflow
```

Conteúdo:
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/omniflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Instalação em VPS (Produção)

### Provedor de VPS Recomendado
- DigitalOcean
- AWS EC2
- Google Cloud
- Azure
- Hetzner
- Vultr

### Especificações Recomendadas
- **Droplet/Instance**: 4GB RAM, 2 vCPUs, 50GB SSD
- **SO**: Ubuntu 22.04 LTS
- **Região**: Mais próxima dos seus usuários

### Passo 1: Conectar ao Servidor
```bash
ssh root@seu-ip-servidor
```

### Passo 2: Criar Usuário Não-Root
```bash
adduser omniflow
usermod -aG sudo omniflow
su - omniflow
```

### Passo 3: Configurar Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Passo 4: Instalar Dependências
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx postgresql postgresql-contrib git curl

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
sudo npm install -g pm2
```

### Passo 5: Clonar e Configurar Aplicação
```bash
cd ~
git clone https://github.com/seu-usuario/omniflow.git
cd omniflow
npm install
npm run build
```

### Passo 6: Configurar Variáveis de Ambiente
```bash
nano .env.production
```

```env
# Production Config
NODE_ENV=production
VITE_APP_URL=https://seudominio.com
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave

# Se usar banco local
DATABASE_URL=postgresql://user:password@localhost:5432/omniflow
```

### Passo 7: Configurar PM2
```bash
pm2 start npm --name "omniflow" -- start
pm2 startup systemd
pm2 save
```

### Passo 8: Configurar Nginx com SSL
```bash
sudo nano /etc/nginx/sites-available/omniflow
```

```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seudominio.com www.seudominio.com;

    ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Passo 9: Instalar Certificado SSL
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

### Passo 10: Ativar Configuração
```bash
sudo ln -s /etc/nginx/sites-available/omniflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Instalação com Docker

### Passo 1: Instalar Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Passo 2: Instalar Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Passo 3: Criar docker-compose.yml
O projeto já inclui um `docker-compose.yml`. Verifique e ajuste conforme necessário.

### Passo 4: Configurar .env
```bash
cp .env.example .env
nano .env
```

### Passo 5: Iniciar Containers
```bash
docker-compose up -d
```

### Passo 6: Verificar Status
```bash
docker-compose ps
docker-compose logs -f
```

### Comandos Úteis
```bash
# Parar containers
docker-compose down

# Rebuild após mudanças
docker-compose up -d --build

# Ver logs
docker-compose logs -f app

# Acessar shell do container
docker-compose exec app sh
```

---

## Instalação sem Supabase

### Arquitetura
Quando não usa Supabase, você precisa:
- PostgreSQL local/externo
- Sistema de autenticação próprio (JWT)
- API REST própria
- Sistema de storage próprio

### Passo 1: Instalar PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Passo 2: Criar Banco e Usuário
```bash
sudo -u postgres psql

CREATE DATABASE omniflow;
CREATE USER omniflow_admin WITH ENCRYPTED PASSWORD 'senha_super_segura';
GRANT ALL PRIVILEGES ON DATABASE omniflow TO omniflow_admin;
\c omniflow
GRANT ALL ON SCHEMA public TO omniflow_admin;
\q
```

### Passo 3: Executar Schema SQL
```bash
psql -U omniflow_admin -d omniflow -f database/schema.sql
```

### Passo 4: Configurar Backend API
Crie `server/index.js`:

```javascript
const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(cors());
app.use(express.json());

// Auth endpoints
app.post('/api/auth/signup', async (req, res) => {
  // Implementar signup
});

app.post('/api/auth/login', async (req, res) => {
  // Implementar login
});

// Protected routes
app.use('/api/*', authenticateToken);

// CRUD endpoints
// ... implementar endpoints necessários

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Passo 5: Configurar Frontend
Modifique `src/lib/api.ts` para usar sua API ao invés do Supabase.

---

## Auto-Instalador

O OmniFlow inclui scripts de auto-instalação similares ao Izing.

### Uso do Auto-Instalador

```bash
# Baixar e executar
curl -fsSL https://raw.githubusercontent.com/seu-usuario/omniflow/main/scripts/auto-install.sh | bash
```

### O que o Auto-Instalador faz:
1. ✅ Verifica requisitos do sistema
2. ✅ Instala dependências (Node.js, PostgreSQL, Nginx, PM2)
3. ✅ Clona o repositório
4. ✅ Configura banco de dados
5. ✅ Gera .env com valores padrão
6. ✅ Executa migrações
7. ✅ Configura Nginx
8. ✅ Instala certificado SSL (opcional)
9. ✅ Configura PM2
10. ✅ Inicia aplicação

### Opções do Instalador
```bash
./scripts/auto-install.sh --help

Opções:
  --with-supabase    Instalar com Supabase
  --no-supabase      Instalar sem Supabase (com PostgreSQL local)
  --domain DOMAIN    Configurar domínio
  --ssl              Instalar certificado SSL
  --skip-deps        Pular instalação de dependências
  --dev              Modo desenvolvimento
  --help             Mostrar ajuda
```

### Exemplos
```bash
# Instalação padrão com Supabase
./scripts/auto-install.sh --with-supabase

# Instalação sem Supabase
./scripts/auto-install.sh --no-supabase

# Instalação com domínio e SSL
./scripts/auto-install.sh --domain omniflow.com --ssl

# Desenvolvimento
./scripts/auto-install.sh --dev
```

---

## Configuração Pós-Instalação

### 1. Criar Super Admin
Após a instalação, acesse a aplicação e crie o primeiro usuário como Super Admin.

### 2. Configurar SMTP (Email)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-app
```

### 3. Configurar Storage
Se não usar Supabase Storage:
```bash
mkdir -p storage/uploads
chmod 755 storage/uploads
```

### 4. Configurar Backups
```bash
# Adicionar ao crontab
crontab -e

# Backup diário às 2h
0 2 * * * /home/omniflow/omniflow/scripts/backup.sh
```

### 5. Monitoramento
```bash
# Instalar monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Monit orwebUI
pm2 plus
```

---

## Troubleshooting

### Problema: Aplicação não inicia
**Solução**:
```bash
# Verificar logs
pm2 logs omniflow

# Verificar porta
sudo lsof -i :5173

# Reiniciar
pm2 restart omniflow
```

### Problema: Erro de conexão com banco
**Solução**:
```bash
# Testar conexão PostgreSQL
psql -U omniflow_admin -d omniflow -h localhost

# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar configuração
cat .env | grep DATABASE
```

### Problema: Erro 502 Bad Gateway (Nginx)
**Solução**:
```bash
# Verificar se app está rodando
pm2 list

# Verificar configuração Nginx
sudo nginx -t

# Ver logs Nginx
sudo tail -f /var/log/nginx/error.log
```

### Problema: SSL não funciona
**Solução**:
```bash
# Renovar certificado
sudo certbot renew --dry-run
sudo certbot renew

# Verificar auto-renewal
sudo systemctl status certbot.timer
```

### Problema: Alta utilização de CPU/RAM
**Solução**:
```bash
# Ver processos
pm2 monit

# Limitar uso de memória
pm2 start app.js --max-memory-restart 500M

# Otimizar Node.js
NODE_OPTIONS="--max-old-space-size=2048" pm2 restart omniflow
```

---

## Suporte

### Documentação
- [Documentação Principal](./README.md)
- [FAQ](./FAQ.md)
- [API Reference](./API_REFERENCE.md)

### Comunidade
- GitHub Issues: https://github.com/seu-usuario/omniflow/issues
- Discord: https://discord.gg/omniflow
- Email: suporte@omniflow.com

### Contribuindo
Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para informações sobre como contribuir.

---

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.
