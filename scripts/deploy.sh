#!/bin/bash
#
# Deploy Script for Cenario Internacional
# Zero-downtime deployment with PM2
#
# Usage: ./scripts/deploy.sh [branch]
#   branch: git branch to deploy (default: main)

set -e

BRANCH=${1:-main}
PROJECT_DIR="/var/www/pem"
BACKUP_DIR="/var/www/pem-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
HEALTH_URL="http://localhost:3000/api/health"
MAX_RETRIES=30
RETRY_INTERVAL=5

echo "=========================================="
echo "  Deploy - Cenario Internacional"
echo "  Branch: $BRANCH"
echo "  Time: $(date)"
echo "=========================================="

cd $PROJECT_DIR

# Create backup directory
mkdir -p $BACKUP_DIR

# Pre-deploy backup
echo "[1/8] Creating backup..."
tar -czf $BACKUP_DIR/pre-deploy-$TIMESTAMP.tar.gz \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    . 2>/dev/null || echo "Warning: Backup creation had issues"

# Pull latest code
echo "[2/8] Pulling latest code from $BRANCH..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Install dependencies
echo "[3/8] Installing dependencies..."
npm ci --ignore-scripts

# Build application
echo "[4/8] Building application..."
npm run build

# Get current PM2 process info
echo "[5/8] Checking PM2 status..."
PM2_RUNNING=$(pm2 list | grep -c "portal-economico" || echo "0")

if [ "$PM2_RUNNING" -gt 0 ]; then
    echo "PM2 process found, performing reload..."
    
    # Reload with zero-downtime
    echo "[6/8] Reloading PM2 (zero-downtime)..."
    pm2 reload ecosystem.config.js --env production
else
    echo "PM2 process not found, starting fresh..."
    pm2 start ecosystem.config.js --env production
fi

# Wait for application to be healthy
echo "[7/8] Waiting for application to be healthy..."
RETRIES=0
while [ $RETRIES -lt $MAX_RETRIES ]; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "Application is healthy! (HTTP $HTTP_CODE)"
        break
    fi
    
    RETRIES=$((RETRIES + 1))
    echo "Waiting... ($RETRIES/$MAX_RETRIES) - HTTP $HTTP_CODE"
    sleep $RETRY_INTERVAL
done

if [ $RETRIES -eq $MAX_RETRIES ]; then
    echo "ERROR: Application failed to start within timeout"
    echo "Attempting rollback..."
    
    # Rollback
    if [ -f $BACKUP_DIR/pre-deploy-$TIMESTAMP.tar.gz ]; then
        echo "Restoring from backup..."
        rm -rf $PROJECT_DIR/*
        tar -xzf $BACKUP_DIR/pre-deploy-$TIMESTAMP.tar.gz -C $PROJECT_DIR
        npm ci --ignore-scripts
        npm run build
        pm2 restart ecosystem.config.js --env production
    fi
    
    exit 1
fi

# Save PM2 configuration
echo "[8/8] Saving PM2 configuration..."
pm2 save

# Cleanup old backups (keep last 5)
echo "Cleaning up old backups..."
ls -t $BACKUP_DIR/pre-deploy-*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm

echo ""
echo "=========================================="
echo "  Deploy completed successfully!"
echo "=========================================="
echo ""
echo "Application URL: https://cenariointernacional.com.br"
echo "Health Check: https://cenariointernacional.com.br/api/health"
echo ""
echo "PM2 Status:"
pm2 list
echo ""
