#!/bin/bash

# OmniFlow Installation Script
# This script installs and configures OmniFlow on a fresh server

set -e

echo "================================"
echo "OmniFlow Installation Script"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Error: Please run as root (use sudo)"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "Error: Cannot detect OS"
    exit 1
fi

echo "Detected OS: $OS"
echo ""

# Install Docker
echo "Step 1: Installing Docker..."
if ! command -v docker &> /dev/null; then
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get update
        apt-get install -y ca-certificates curl gnupg lsb-release
        
        curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/$OS \
          $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        yum install -y yum-utils
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        systemctl start docker
        systemctl enable docker
    else
        echo "Error: Unsupported OS for automatic Docker installation"
        exit 1
    fi
    
    echo "Docker installed successfully!"
else
    echo "Docker is already installed"
fi

# Install Docker Compose (standalone)
echo ""
echo "Step 2: Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed successfully!"
else
    echo "Docker Compose is already installed"
fi

# Install Git (if not present)
echo ""
echo "Step 3: Installing Git..."
if ! command -v git &> /dev/null; then
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get install -y git
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        yum install -y git
    fi
    echo "Git installed successfully!"
else
    echo "Git is already installed"
fi

# Create application directory
echo ""
echo "Step 4: Setting up application directory..."
APP_DIR="/opt/omniflow"
mkdir -p $APP_DIR
cd $APP_DIR

# Clone or update repository
echo ""
echo "Step 5: Setting up OmniFlow..."
if [ -d ".git" ]; then
    echo "Updating existing installation..."
    git pull
else
    echo "Enter your GitHub repository URL:"
    read -r REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo "Error: Repository URL is required"
        exit 1
    fi
    
    git clone "$REPO_URL" .
fi

# Configure environment variables
echo ""
echo "Step 6: Configuring environment variables..."
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    
    echo "Enter your Supabase URL:"
    read -r SUPABASE_URL
    
    echo "Enter your Supabase Publishable Key:"
    read -r SUPABASE_KEY
    
    echo "Enter your Supabase Project ID:"
    read -r SUPABASE_PROJECT_ID
    
    cat > .env << EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_KEY
VITE_SUPABASE_PROJECT_ID=$SUPABASE_PROJECT_ID
EOF
    
    echo ".env file created successfully!"
else
    echo ".env file already exists"
fi

# Set permissions
chmod 600 .env

# Build and start containers
echo ""
echo "Step 7: Building and starting OmniFlow..."
docker-compose down
docker-compose up -d --build

# Wait for application to start
echo ""
echo "Waiting for application to start..."
sleep 10

# Check if application is running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "================================"
    echo "Installation Complete!"
    echo "================================"
    echo ""
    echo "OmniFlow is now running!"
    echo "Access it at: http://$(hostname -I | awk '{print $1}')"
    echo ""
    echo "Useful commands:"
    echo "  - View logs: docker-compose logs -f"
    echo "  - Stop: docker-compose stop"
    echo "  - Start: docker-compose start"
    echo "  - Restart: docker-compose restart"
    echo "  - Update: cd $APP_DIR && git pull && docker-compose up -d --build"
    echo ""
else
    echo ""
    echo "Error: Application failed to start"
    echo "Check logs with: docker-compose logs"
    exit 1
fi
