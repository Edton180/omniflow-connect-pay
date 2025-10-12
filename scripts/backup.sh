#!/bin/bash

# OmniFlow Backup Script
# Creates a backup of the OmniFlow installation

set -e

echo "================================"
echo "OmniFlow Backup Script"
echo "================================"
echo ""

APP_DIR="/opt/omniflow"
BACKUP_DIR="/opt/omniflow-backups"

# Check if OmniFlow is installed
if [ ! -d "$APP_DIR" ]; then
    echo "Error: OmniFlow is not installed in $APP_DIR"
    exit 1
fi

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup filename
BACKUP_NAME="omniflow-backup-$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/$BACKUP_NAME.tar.gz"

echo "Creating backup..."
cd $APP_DIR

# Create compressed backup
tar -czf "$BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='*.log' \
    .

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo ""
echo "================================"
echo "Backup Complete!"
echo "================================"
echo ""
echo "Backup file: $BACKUP_FILE"
echo "Backup size: $BACKUP_SIZE"
echo ""

# Clean old backups (keep last 10)
echo "Cleaning old backups (keeping last 10)..."
cd $BACKUP_DIR
ls -t omniflow-backup-*.tar.gz | tail -n +11 | xargs -r rm

echo "Backup process completed successfully!"
