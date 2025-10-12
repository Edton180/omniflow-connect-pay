#!/bin/bash

# OmniFlow Update Script
# Updates OmniFlow to the latest version from GitHub

set -e

echo "================================"
echo "OmniFlow Update Script"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Error: Please run as root (use sudo)"
    exit 1
fi

APP_DIR="/opt/omniflow"

# Check if OmniFlow is installed
if [ ! -d "$APP_DIR" ]; then
    echo "Error: OmniFlow is not installed in $APP_DIR"
    exit 1
fi

cd $APP_DIR

# Create backup
echo "Step 1: Creating backup..."
BACKUP_DIR="/opt/omniflow-backups"
mkdir -p $BACKUP_DIR
BACKUP_NAME="omniflow-backup-$(date +%Y%m%d-%H%M%S)"
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" . --exclude='node_modules' --exclude='.git'
echo "Backup created: $BACKUP_DIR/$BACKUP_NAME.tar.gz"

# Pull latest changes
echo ""
echo "Step 2: Pulling latest changes from GitHub..."
git fetch origin
git pull origin $(git rev-parse --abbrev-ref HEAD)

# Rebuild and restart containers
echo ""
echo "Step 3: Rebuilding and restarting containers..."
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
    echo "Update Complete!"
    echo "================================"
    echo ""
    echo "OmniFlow has been updated successfully!"
    echo ""
    echo "Check status with: docker-compose ps"
    echo "View logs with: docker-compose logs -f"
    echo ""
else
    echo ""
    echo "Error: Application failed to start after update"
    echo "Restoring from backup..."
    
    # Restore from backup
    rm -rf *
    tar -xzf "$BACKUP_DIR/$BACKUP_NAME.tar.gz"
    docker-compose up -d --build
    
    echo "Backup restored. Check logs with: docker-compose logs"
    exit 1
fi
