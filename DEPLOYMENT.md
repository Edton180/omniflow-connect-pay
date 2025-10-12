# 🚀 Guia de Deploy - OmniFlow

## Visão Geral

Este guia cobre todas as opções de deployment do OmniFlow, desde instalação local até produção em cloud.

## Requisitos do Sistema

### Mínimo
- CPU: 2 cores
- RAM: 2GB
- Disco: 10GB
- SO: Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+

### Recomendado (Produção)
- CPU: 4 cores
- RAM: 4GB
- Disco: 20GB SSD
- SO: Ubuntu 22.04 LTS

### Software Necessário
- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+
- Nginx (incluído no container)

## Métodos de Deploy

### 1. 🎯 Deploy Rápido com Script (Recomendado)

```bash
# 1. Fazer download do script
curl -o install.sh https://raw.githubusercontent.com/seu-usuario/omniflow/main/scripts/install.sh

# 2. Dar permissão de execução
chmod +x install.sh

# 3. Executar como root
sudo ./install.sh
```

O script irá:
- ✅ Instalar Docker e Docker Compose
- ✅ Clonar o repositório
- ✅ Configurar variáveis de ambiente
- ✅ Build e iniciar a aplicação
- ✅ Configurar health checks

### 2. 🐳 Deploy Manual com Docker Compose

#### Passo 1: Preparar o Ambiente

```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker --version
docker-compose --version
```

#### Passo 2: Clonar o Repositório

```bash
# Via HTTPS
git clone https://github.com/seu-usuario/omniflow.git
cd omniflow

# Ou via SSH
git clone git@github.com:seu-usuario/omniflow.git
cd omniflow
```

#### Passo 3: Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env

# Editar com suas credenciais
nano .env
```

Arquivo `.env`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
VITE_SUPABASE_PROJECT_ID=seu-project-id
```

#### Passo 4: Build e Start

```bash
# Build das imagens
docker-compose build

# Iniciar em background
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f
```

### 3. 📦 Deploy Manual sem Docker

#### Requisitos
- Node.js 20+
- Nginx

#### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Build para produção
npm run build

# 3. Configurar Nginx
sudo cp nginx.conf /etc/nginx/sites-available/omniflow
sudo ln -s /etc/nginx/sites-available/omniflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 4. Servir com PM2 (opcional para SSR)
npm install -g pm2
pm2 start npm --name "omniflow" -- run preview
pm2 save
pm2 startup
```

## Configuração de Produção

### SSL/HTTPS com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com.br

# Renovação automática
sudo certbot renew --dry-run
```

### Nginx para Docker com SSL

Editar `nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name seu-dominio.com.br;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # ... resto da configuração
}

server {
    listen 80;
    listen [::]:80;
    server_name seu-dominio.com.br;
    return 301 https://$server_name$request_uri;
}
```

### Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

## Gerenciamento da Aplicação

### Comandos Docker Compose

```bash
# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f
docker-compose logs -f omniflow

# Parar
docker-compose stop

# Iniciar
docker-compose start

# Reiniciar
docker-compose restart

# Parar e remover
docker-compose down

# Build e reiniciar
docker-compose up -d --build

# Limpar tudo
docker-compose down -v --rmi all
```

### Scripts de Manutenção

#### Atualização
```bash
sudo ./scripts/update.sh
```

#### Backup
```bash
sudo ./scripts/backup.sh
```

#### Restaurar Backup
```bash
cd /opt/omniflow
sudo tar -xzf /opt/omniflow-backups/backup-nome.tar.gz
sudo docker-compose up -d --build
```

## Deploy em Cloud Providers

### AWS EC2

1. Lançar instância EC2 (Ubuntu 22.04)
2. Configurar Security Group (portas 22, 80, 443)
3. Conectar via SSH
4. Executar script de instalação
5. Configurar Route 53 para DNS
6. Configurar ELB (opcional)

### Google Cloud Platform

```bash
# Criar VM
gcloud compute instances create omniflow \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --machine-type=e2-medium \
    --zone=southamerica-east1-a

# Conectar
gcloud compute ssh omniflow

# Instalar
curl -o install.sh https://raw.githubusercontent.com/seu-usuario/omniflow/main/scripts/install.sh
chmod +x install.sh
sudo ./install.sh
```

### DigitalOcean

1. Criar Droplet (Ubuntu 22.04)
2. Adicionar chave SSH
3. Conectar via SSH
4. Executar script de instalação
5. Configurar DNS

### Azure

```bash
# Criar VM
az vm create \
    --resource-group omniflow-rg \
    --name omniflow-vm \
    --image UbuntuLTS \
    --size Standard_B2s \
    --generate-ssh-keys

# Abrir portas
az vm open-port --resource-group omniflow-rg --name omniflow-vm --port 80
az vm open-port --resource-group omniflow-rg --name omniflow-vm --port 443

# Conectar
ssh azureuser@<IP-PUBLICO>

# Instalar
curl -o install.sh https://raw.githubusercontent.com/seu-usuario/omniflow/main/scripts/install.sh
chmod +x install.sh
sudo ./install.sh
```

## Monitoramento

### Health Checks

```bash
# Verificar saúde do container
docker inspect --format='{{.State.Health.Status}}' omniflow-app

# Endpoint de health
curl http://localhost/health
```

### Logs

```bash
# Ver logs em tempo real
docker-compose logs -f

# Logs do Nginx
docker-compose exec omniflow tail -f /var/log/nginx/access.log
docker-compose exec omniflow tail -f /var/log/nginx/error.log

# Exportar logs
docker-compose logs > omniflow-logs-$(date +%Y%m%d).log
```

### Métricas

Adicionar ao `docker-compose.yml`:

```yaml
services:
  # ... outros serviços
  
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
```

## Troubleshooting

### Container não inicia

```bash
# Ver logs de erro
docker-compose logs omniflow

# Verificar recursos
docker stats

# Rebuild limpo
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Problemas de permissão

```bash
# Corrigir permissões
sudo chown -R $USER:$USER /opt/omniflow
sudo chmod -R 755 /opt/omniflow
```

### Problemas de rede

```bash
# Reiniciar rede Docker
docker network prune
docker-compose down
docker-compose up -d
```

### Banco de dados não conecta

1. Verificar variáveis de ambiente no `.env`
2. Testar conectividade: `curl -I $VITE_SUPABASE_URL`
3. Verificar RLS policies no Supabase
4. Verificar logs: `docker-compose logs`

## Segurança

### Checklist de Segurança

- [ ] Firewall configurado (apenas 22, 80, 443)
- [ ] SSL/HTTPS configurado
- [ ] Senhas fortes no `.env`
- [ ] Arquivo `.env` com permissão 600
- [ ] Atualizações automáticas de segurança
- [ ] Backups regulares configurados
- [ ] Logs rotacionados
- [ ] Fail2ban instalado (opcional)
- [ ] Rate limiting no Nginx

### Hardening

```bash
# Instalar fail2ban
sudo apt install fail2ban

# Configurar rate limiting no Nginx
limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
limit_req zone=one burst=20;

# Desabilitar SSH com senha
sudo nano /etc/ssh/sshd_config
# PasswordAuthentication no
sudo systemctl restart sshd
```

## Performance

### Otimizações

1. **Nginx Caching**
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;
```

2. **Compressão**
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

3. **CDN** (Cloudflare, AWS CloudFront)

4. **Database Indexes** (já configurado no Supabase)

## Backup e Recuperação

### Estratégia de Backup

- **Diário**: Automático via cron
- **Semanal**: Manual via script
- **Mensal**: Archive para storage externo

### Configurar Backup Automático

```bash
# Adicionar ao crontab
sudo crontab -e

# Backup diário às 2h da manhã
0 2 * * * /opt/omniflow/scripts/backup.sh
```

## CI/CD

### GitHub Actions

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/omniflow
            git pull
            docker-compose up -d --build
```

## Suporte

- 📚 Documentação: https://github.com/seu-usuario/omniflow
- 🐛 Issues: https://github.com/seu-usuario/omniflow/issues
- 💬 Discord: [link do discord]

---

**Última atualização**: Fase 6 - Deploy e Infraestrutura ✅
