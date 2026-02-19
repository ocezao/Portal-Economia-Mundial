#!/bin/bash
#
# Rollback Script for Cenario Internacional
# Restores from a backup
#
# Usage: ./scripts/rollback.sh [backup_file]
#   backup_file: specific backup to restore (optional, uses latest if not provided)

set -e

PROJECT_DIR="/var/www/pem"
BACKUP_DIR="/var/www/pem-backups"

echo "=========================================="
echo "  Rollback - Cenario Internacional"
echo "=========================================="

# List available backups
echo "Available backups:"
ls -lt $BACKUP_DIR/*.tar.gz 2>/dev/null || echo "No backups found"
echo ""

# Determine which backup to use
if [ -n "$1" ]; then
    BACKUP_FILE=$1
else
    BACKUP_FILE=$(ls -t $BACKUP_DIR/*.tar.gz 2>/dev/null | head -n1)
fi

if [ -z "$BACKUP_FILE" ]; then
    echo "ERROR: No backup file found"
    exit 1
fi

echo "Using backup: $BACKUP_FILE"
read -p "Continue with rollback? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollback cancelled"
    exit 0
fi

cd $PROJECT_DIR

# Stop PM2
echo "[1/4] Stopping PM2..."
pm2 stop portal-economico || true

# Create emergency backup of current state
echo "[2/4] Creating emergency backup of current state..."
EMERGENCY_BACKUP="$BACKUP_DIR/emergency-$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf $EMERGENCY_BACKUP \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    . 2>/dev/null || echo "Warning: Emergency backup had issues"
echo "Emergency backup saved: $EMERGENCY_BACKUP"

# Restore from backup
echo "[3/4] Restoring from backup..."
rm -rf $PROJECT_DIR/*
rm -rf $PROJECT_DIR/.[!.]*
tar -xzf $BACKUP_FILE -C $PROJECT_DIR

# Reinstall and rebuild
echo "[4/4] Reinstalling and rebuilding..."
npm ci --ignore-scripts
npm run build

# Restart PM2
echo "Starting PM2..."
pm2 restart ecosystem.config.js --env production

echo ""
echo "=========================================="
echo "  Rollback completed!"
echo "=========================================="
echo ""
echo "Emergency backup saved at: $EMERGENCY_BACKUP"
echo ""
echo "Check application status:"
echo "  pm2 list"
echo "  curl https://cenariointernacional.com.br/api/health"
echo ""
