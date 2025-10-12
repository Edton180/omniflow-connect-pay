#!/bin/bash

# Script to setup correct permissions for all scripts

echo "Setting up permissions for OmniFlow scripts..."

# Make all scripts executable
chmod +x scripts/install.sh
chmod +x scripts/update.sh
chmod +x scripts/backup.sh
chmod +x scripts/setup-permissions.sh

echo "✅ Permissions set successfully!"
echo ""
echo "You can now run:"
echo "  sudo ./scripts/install.sh   - Install OmniFlow"
echo "  sudo ./scripts/update.sh    - Update OmniFlow"
echo "  sudo ./scripts/backup.sh    - Backup OmniFlow"
