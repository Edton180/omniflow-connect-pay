#!/bin/bash

# OmniFlow Enhanced Auto-Installer
# Similar to Izing/Whaticket installer
# Supports installation with and without Supabase

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="OmniFlow"
APP_DIR="/opt/omniflow"
APP_USER="omniflow"
NODE_VERSION="18"

# Installation flags
WITH_SUPABASE=false
WITH_SSL=false
DOMAIN=""
SKIP_DEPS=false
DEV_MODE=false

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════"
    echo "  $APP_NAME - Auto Installer"
    echo "  Version: 1.0.0"
    echo "═══════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "Este script precisa ser executado como root"
        exit 1
    fi
}

check_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        print_error "Sistema operacional não suportado"
        exit 1
    fi

    if [[ "$OS" != "ubuntu" ]] && [[ "$OS" != "debian" ]]; then
        print_error "Este instalador suporta apenas Ubuntu e Debian"
        exit 1
    fi

    print_success "Sistema operacional: $OS $VER"
}

show_help() {
    echo "Uso: $0 [OPTIONS]"
    echo ""
    echo "Opções:"
    echo "  --with-supabase       Instalar com Supabase"
    echo "  --no-supabase         Instalar sem Supabase (PostgreSQL local)"
    echo "  --domain DOMAIN       Configurar domínio"
    echo "  --ssl                 Instalar certificado SSL"
    echo "  --skip-deps           Pular instalação de dependências"
    echo "  --dev                 Modo desenvolvimento"
    echo "  --help                Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 --with-supabase"
    echo "  $0 --no-supabase --domain omniflow.com --ssl"
    exit 0
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --with-supabase)
                WITH_SUPABASE=true
                shift
                ;;
            --no-supabase)
                WITH_SUPABASE=false
                shift
                ;;
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --ssl)
                WITH_SSL=true
                shift
                ;;
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --dev)
                DEV_MODE=true
                shift
                ;;
            --help)
                show_help
                ;;
            *)
                print_error "Opção desconhecida: $1"
                show_help
                ;;
        esac
    done
}

install_dependencies() {
    if [[ "$SKIP_DEPS" = true ]]; then
        print_info "Pulando instalação de dependências"
        return
    fi

    print_step "Instalando dependências do sistema..."
    
    apt-get update
    apt-get install -y \
        curl \
        wget \
        git \
        build-essential \
        nginx \
        sudo \
        ufw \
        certbot \
        python3-certbot-nginx
    
    print_success "Dependências instaladas"
}

install_nodejs() {
    if command -v node &> /dev/null; then
        NODE_CURRENT_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ "$NODE_CURRENT_VERSION" -ge "$NODE_VERSION" ]]; then
            print_success "Node.js já instalado: $(node -v)"
            return
        fi
    fi

    print_step "Instalando Node.js $NODE_VERSION..."
    
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
    
    print_success "Node.js instalado: $(node -v)"
    
    # Install PM2
    npm install -g pm2
    print_success "PM2 instalado"
}

install_postgresql() {
    if [[ "$WITH_SUPABASE" = true ]]; then
        print_info "Supabase será usado, pulando instalação do PostgreSQL"
        return
    fi

    if command -v psql &> /dev/null; then
        print_success "PostgreSQL já instalado"
        return
    fi

    print_step "Instalando PostgreSQL..."
    
    apt-get install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    
    print_success "PostgreSQL instalado"
}

create_user() {
    if id "$APP_USER" &>/dev/null; then
        print_success "Usuário $APP_USER já existe"
    else
        print_step "Criando usuário $APP_USER..."
        useradd -m -s /bin/bash $APP_USER
        usermod -aG sudo $APP_USER
        print_success "Usuário criado"
    fi
}

setup_database() {
    if [[ "$WITH_SUPABASE" = true ]]; then
        print_info "Usando Supabase - configuração manual necessária"
        return
    fi

    print_step "Configurando banco de dados..."
    
    DB_NAME="omniflow"
    DB_USER="omniflow_admin"
    DB_PASS=$(openssl rand -base64 32)
    
    sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF
    
    echo "DB_NAME=$DB_NAME" > /tmp/db_config
    echo "DB_USER=$DB_USER" >> /tmp/db_config
    echo "DB_PASS=$DB_PASS" >> /tmp/db_config
    
    print_success "Banco de dados configurado"
}

clone_repository() {
    print_step "Clonando repositório..."
    
    if [[ -d "$APP_DIR" ]]; then
        print_info "Diretório já existe, fazendo backup..."
        mv $APP_DIR ${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)
    fi
    
    mkdir -p $APP_DIR
    git clone https://github.com/seu-usuario/omniflow.git $APP_DIR
    chown -R $APP_USER:$APP_USER $APP_DIR
    
    print_success "Repositório clonado"
}

install_app_dependencies() {
    print_step "Instalando dependências da aplicação..."
    
    cd $APP_DIR
    sudo -u $APP_USER npm install
    
    print_success "Dependências instaladas"
}

configure_env() {
    print_step "Configurando variáveis de ambiente..."
    
    cd $APP_DIR
    
    if [[ "$WITH_SUPABASE" = true ]]; then
        cat > .env <<EOF
# Supabase Configuration
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=

# Application
NODE_ENV=production
VITE_APP_NAME=$APP_NAME
VITE_APP_URL=${DOMAIN:+https://$DOMAIN}
EOF
        
        print_info "Configure as variáveis do Supabase em $APP_DIR/.env"
    else
        source /tmp/db_config
        
        JWT_SECRET=$(openssl rand -base64 64)
        
        cat > .env <<EOF
# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=7d

# Application
NODE_ENV=production
VITE_APP_NAME=$APP_NAME
VITE_APP_URL=${DOMAIN:+https://$DOMAIN}
API_URL=http://localhost:3000
EOF
    fi
    
    chown $APP_USER:$APP_USER .env
    chmod 600 .env
    
    print_success "Arquivo .env configurado"
}

build_app() {
    print_step "Compilando aplicação..."
    
    cd $APP_DIR
    sudo -u $APP_USER npm run build
    
    print_success "Aplicação compilada"
}

configure_pm2() {
    print_step "Configurando PM2..."
    
    cd $APP_DIR
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
    }
  }]
}
EOF
    
    sudo -u $APP_USER pm2 start ecosystem.config.js
    sudo -u $APP_USER pm2 save
    
    # Setup PM2 startup
    pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
    
    print_success "PM2 configurado"
}

configure_nginx() {
    print_step "Configurando Nginx..."
    
    NGINX_CONFIG="/etc/nginx/sites-available/$APP_NAME"
    
    if [[ -z "$DOMAIN" ]]; then
        DOMAIN="_"
    fi
    
    cat > $NGINX_CONFIG <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    ${WITH_SSL:+return 301 https://\$server_name\$request_uri;}
    
    ${WITH_SSL:-location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # WebSocket support
        proxy_read_timeout 86400;
    \}}
}

${WITH_SSL:+server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # WebSocket support
        proxy_read_timeout 86400;
    \}
\}}
EOF
    
    ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    nginx -t
    systemctl restart nginx
    
    print_success "Nginx configurado"
}

configure_ssl() {
    if [[ "$WITH_SSL" = false ]] || [[ -z "$DOMAIN" ]] || [[ "$DOMAIN" = "_" ]]; then
        return
    fi
    
    print_step "Configurando SSL com Let's Encrypt..."
    
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email
    
    # Setup auto-renewal
    systemctl enable certbot.timer
    
    print_success "SSL configurado"
}

configure_firewall() {
    print_step "Configurando firewall..."
    
    ufw --force enable
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    print_success "Firewall configurado"
}

setup_backup() {
    print_step "Configurando sistema de backup..."
    
    BACKUP_SCRIPT="$APP_DIR/scripts/backup.sh"
    
    if [[ -f "$BACKUP_SCRIPT" ]]; then
        chmod +x $BACKUP_SCRIPT
        
        # Add to crontab
        (crontab -u $APP_USER -l 2>/dev/null; echo "0 2 * * * $BACKUP_SCRIPT") | crontab -u $APP_USER -
        
        print_success "Backups automáticos configurados (diariamente às 2h)"
    fi
}

print_summary() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Instalação Concluída com Sucesso!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo ""
    
    if [[ -n "$DOMAIN" ]] && [[ "$DOMAIN" != "_" ]]; then
        if [[ "$WITH_SSL" = true ]]; then
            echo -e "  🌐 URL: ${BLUE}https://$DOMAIN${NC}"
        else
            echo -e "  🌐 URL: ${BLUE}http://$DOMAIN${NC}"
        fi
    else
        echo -e "  🌐 URL: ${BLUE}http://$(hostname -I | awk '{print $1}')${NC}"
    fi
    
    echo ""
    echo -e "  📁 Diretório: ${YELLOW}$APP_DIR${NC}"
    echo -e "  👤 Usuário: ${YELLOW}$APP_USER${NC}"
    
    if [[ "$WITH_SUPABASE" = false ]]; then
        source /tmp/db_config 2>/dev/null || true
        echo -e "  🗄️  Banco: ${YELLOW}$DB_NAME${NC}"
        echo -e "  🔑 Credenciais salvas em: ${YELLOW}$APP_DIR/.env${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}Comandos Úteis:${NC}"
    echo -e "  pm2 list              - Listar processos"
    echo -e "  pm2 logs $APP_NAME    - Ver logs"
    echo -e "  pm2 restart $APP_NAME - Reiniciar app"
    echo -e "  pm2 monit             - Monitorar recursos"
    echo ""
    
    if [[ "$WITH_SUPABASE" = true ]]; then
        echo -e "${YELLOW}⚠️  Próximos Passos:${NC}"
        echo -e "  1. Configure as variáveis do Supabase em $APP_DIR/.env"
        echo -e "  2. Execute: cd $APP_DIR && pm2 restart $APP_NAME"
        echo ""
    fi
    
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

# Main installation
main() {
    print_header
    
    parse_args "$@"
    
    check_root
    check_os
    
    print_info "Iniciando instalação..."
    echo ""
    
    install_dependencies
    install_nodejs
    install_postgresql
    create_user
    setup_database
    clone_repository
    install_app_dependencies
    configure_env
    build_app
    configure_pm2
    configure_nginx
    configure_ssl
    configure_firewall
    setup_backup
    
    print_summary
}

# Run main function
main "$@"
