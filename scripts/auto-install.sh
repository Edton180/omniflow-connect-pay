#!/bin/bash

#######################################################################################
# OmniFlow - Script de Instalação Automática
# Instalador completo para VPS, cPanel, localhost e VirtualBox
#######################################################################################

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sem cor

# Funções auxiliares
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Banner
clear
echo -e "${BLUE}"
cat << "EOF"
   ____                  _ ______ _                 
  / __ \                (_)  ____| |                
 | |  | |_ __ ___  _ __  _| |__  | | _____      __ 
 | |  | | '_ ` _ \| '_ \| |  __| | |/ _ \ \ /\ / / 
 | |__| | | | | | | | | | | |    | | (_) \ V  V /  
  \____/|_| |_| |_|_| |_|_|_|    |_|\___/ \_/\_/   
                                                    
         Instalador Automático v1.0
EOF
echo -e "${NC}"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    print_error "Por favor, execute como root (use sudo)"
    exit 1
fi

# Detectar sistema operacional
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
    else
        print_error "Sistema operacional não suportado"
        exit 1
    fi
    print_success "Sistema detectado: $OS $VERSION"
}

# Menu de instalação
show_menu() {
    echo ""
    echo "Escolha o tipo de instalação:"
    echo "1) VPS - Instalação completa em servidor"
    echo "2) cPanel - Instalação em hospedagem cPanel"
    echo "3) Localhost - Instalação local para desenvolvimento"
    echo "4) VirtualBox - Instalação em VM"
    echo "5) Sair"
    echo ""
    read -p "Digite sua escolha [1-5]: " choice
}

# Instalação de dependências base
install_dependencies() {
    print_info "Instalando dependências..."
    
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get update
        apt-get install -y curl wget git software-properties-common ca-certificates apt-transport-https
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        yum install -y curl wget git
    fi
    
    print_success "Dependências instaladas"
}

# Instalar Docker
install_docker() {
    print_info "Instalando Docker..."
    
    if command -v docker &> /dev/null; then
        print_warning "Docker já está instalado"
        return
    fi
    
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    
    # Instalar Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker instalado com sucesso"
}

# Instalar Node.js
install_nodejs() {
    print_info "Instalando Node.js 18..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_warning "Node.js já instalado: $NODE_VERSION"
        return
    fi
    
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    print_success "Node.js instalado: $(node -v)"
}

# Configurar firewall
configure_firewall() {
    print_info "Configurando firewall..."
    
    if command -v ufw &> /dev/null; then
        ufw allow 22/tcp  # SSH
        ufw allow 80/tcp  # HTTP
        ufw allow 443/tcp # HTTPS
        ufw allow 8080/tcp # Evolution API
        ufw --force enable
        print_success "UFW configurado"
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-port=22/tcp
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --permanent --add-port=8080/tcp
        firewall-cmd --reload
        print_success "Firewalld configurado"
    fi
}

# Instalação em VPS
install_vps() {
    print_info "Iniciando instalação em VPS..."
    
    detect_os
    install_dependencies
    install_docker
    install_nodejs
    
    # Criar diretório de instalação
    APP_DIR="/opt/omniflow"
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    # Coletar informações
    read -p "Digite a URL do repositório Git: " REPO_URL
    read -p "Digite seu domínio (ex: omniflow.com.br): " DOMAIN
    read -p "Digite a URL do Supabase: " SUPABASE_URL
    read -p "Digite a chave pública do Supabase: " SUPABASE_KEY
    read -p "Digite o ID do projeto Supabase: " SUPABASE_PROJECT_ID
    
    # Clonar repositório
    print_info "Clonando repositório..."
    if [ -d ".git" ]; then
        git pull
    else
        git clone "$REPO_URL" .
    fi
    
    # Criar arquivo .env
    print_info "Configurando variáveis de ambiente..."
    cat > .env << EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_KEY
VITE_SUPABASE_PROJECT_ID=$SUPABASE_PROJECT_ID
EOF
    
    chmod 600 .env
    
    # Instalar dependências do projeto
    print_info "Instalando dependências do projeto..."
    npm install
    
    # Build do projeto
    print_info "Compilando projeto..."
    npm run build
    
    # Instalar e configurar Nginx
    print_info "Configurando Nginx..."
    apt-get install -y nginx
    
    cat > /etc/nginx/sites-available/omniflow << EOF
server {
    listen 80;
    server_name $DOMAIN;

    root $APP_DIR/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Compressão
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache de assets estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/omniflow /etc/nginx/sites-enabled/
    nginx -t
    systemctl restart nginx
    
    # Instalar SSL com Certbot
    print_info "Instalando SSL (Let's Encrypt)..."
    apt-get install -y certbot python3-certbot-nginx
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # Configurar firewall
    configure_firewall
    
    # Instalar Evolution API
    setup_evolution_api
    
    print_success "Instalação em VPS concluída!"
    print_info "Acesse: https://$DOMAIN"
}

# Setup Evolution API
setup_evolution_api() {
    print_info "Instalando Evolution API..."
    
    EVOLUTION_DIR="/opt/evolution-api"
    mkdir -p $EVOLUTION_DIR
    cd $EVOLUTION_DIR
    
    read -p "Digite uma chave API segura para Evolution API (min. 32 caracteres): " EVOLUTION_API_KEY
    
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:v2.1.1
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=https://api.\${DOMAIN}
      - AUTHENTICATION_API_KEY=$EVOLUTION_API_KEY
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=\${DATABASE_URI}
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
EOF
    
    docker-compose up -d
    
    print_success "Evolution API instalada e rodando na porta 8080"
}

# Instalação em cPanel
install_cpanel() {
    print_info "Instruções para instalação em cPanel:"
    echo ""
    echo "1. Faça o build local do projeto:"
    echo "   npm install && npm run build"
    echo ""
    echo "2. No cPanel, navegue até File Manager"
    echo ""
    echo "3. Faça upload da pasta 'dist' para public_html"
    echo ""
    echo "4. Crie um arquivo .htaccess em public_html com:"
    cat << 'EOF'
    
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
EOF
    echo ""
    echo "5. Configure as variáveis de ambiente no cPanel"
    print_info "Pressione ENTER para continuar..."
    read
}

# Instalação Localhost
install_localhost() {
    print_info "Instalação para desenvolvimento local..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js não encontrado. Instale Node.js 18+ primeiro."
        exit 1
    fi
    
    print_success "Node.js encontrado: $(node -v)"
    
    # Clonar ou atualizar repositório
    read -p "Digite o caminho onde deseja instalar (padrão: ./omniflow): " INSTALL_PATH
    INSTALL_PATH=${INSTALL_PATH:-./omniflow}
    
    mkdir -p "$INSTALL_PATH"
    cd "$INSTALL_PATH"
    
    read -p "Digite a URL do repositório Git: " REPO_URL
    
    if [ -d ".git" ]; then
        git pull
    else
        git clone "$REPO_URL" .
    fi
    
    # Configurar .env
    read -p "Digite a URL do Supabase: " SUPABASE_URL
    read -p "Digite a chave pública do Supabase: " SUPABASE_KEY
    read -p "Digite o ID do projeto Supabase: " SUPABASE_PROJECT_ID
    
    cat > .env << EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_KEY
VITE_SUPABASE_PROJECT_ID=$SUPABASE_PROJECT_ID
EOF
    
    # Instalar dependências
    print_info "Instalando dependências..."
    npm install
    
    print_success "Instalação concluída!"
    print_info "Para iniciar o servidor de desenvolvimento, execute:"
    echo "  cd $INSTALL_PATH"
    echo "  npm run dev"
}

# Instalação VirtualBox
install_virtualbox() {
    print_info "Instalação em VirtualBox..."
    print_info "Esta instalação é similar à VPS, mas otimizada para VM"
    
    detect_os
    install_dependencies
    install_docker
    install_nodejs
    
    # Continuar com instalação VPS
    install_vps
}

# Criar script de backup
create_backup_script() {
    print_info "Criando script de backup automático..."
    
    cat > /usr/local/bin/backup-omniflow.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/omniflow"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup Evolution API data
if [ -d "/opt/evolution-api" ]; then
    cd /opt/evolution-api
    docker exec evolution-api tar czf - /evolution/instances > "$BACKUP_DIR/evolution_$DATE.tar.gz"
fi

# Backup OmniFlow
if [ -d "/opt/omniflow" ]; then
    tar czf "$BACKUP_DIR/omniflow_$DATE.tar.gz" /opt/omniflow
fi

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF
    
    chmod +x /usr/local/bin/backup-omniflow.sh
    
    # Adicionar ao cron
    (crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-omniflow.sh") | crontab -
    
    print_success "Script de backup configurado (execução diária às 3h)"
}

# Menu principal
main() {
    show_menu
    
    case $choice in
        1)
            install_vps
            create_backup_script
            ;;
        2)
            install_cpanel
            ;;
        3)
            install_localhost
            ;;
        4)
            install_virtualbox
            create_backup_script
            ;;
        5)
            print_info "Saindo..."
            exit 0
            ;;
        *)
            print_error "Opção inválida"
            exit 1
            ;;
    esac
    
    echo ""
    print_success "═══════════════════════════════════════════════"
    print_success "  Instalação do OmniFlow concluída!"
    print_success "═══════════════════════════════════════════════"
    echo ""
    print_info "Próximos passos:"
    echo "  1. Acesse o sistema e faça o primeiro login"
    echo "  2. Complete o setup do Super Admin"
    echo "  3. Configure os canais e gateways de pagamento"
    echo "  4. Customize a marca branca"
    echo ""
    print_info "Documentação: https://docs.omniflow.com.br"
    print_info "Suporte: support@omniflow.com.br"
    echo ""
}

# Executar
main
