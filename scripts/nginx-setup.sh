#!/bin/bash
#
# Nginx Setup Script for Docker + Nginx deploy
# Run on VPS as root or with sudo
#
# Usage: ./scripts/nginx-setup.sh

set -e

DOMAIN="cenariointernacional.com.br"
EMAIL="contato@cenariointernacional.com.br"

echo "=========================================="
echo "  Nginx Setup - Docker + Nginx"
echo "=========================================="

if [ "$EUID" -ne 0 ]; then
    echo "Error: Please run as root or with sudo"
    exit 1
fi

if ! command -v nginx &> /dev/null; then
    echo "[1/7] Installing Nginx..."
    apt update
    apt install -y nginx
else
    echo "[1/7] Nginx already installed"
fi

if ! command -v certbot &> /dev/null; then
    echo "[2/7] Installing Certbot..."
    apt install -y certbot python3-certbot-nginx
else
    echo "[2/7] Certbot already installed"
fi

echo "[3/7] Installing project Nginx config..."
cp deploy/nginx/portal.conf /etc/nginx/sites-available/portal

if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    echo "Removed default Nginx site"
fi

echo "[4/7] Enabling site..."
ln -sf /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/portal

echo "[5/7] Testing Nginx configuration..."
nginx -t

echo "[6/7] Reloading Nginx..."
systemctl reload nginx
systemctl enable nginx

echo "[7/7] Done"
echo ""
echo "Next steps:"
echo "1. Start the stack with: docker compose -f docker-compose.prod.yml --env-file .env up -d --build"
echo "2. Issue SSL with: certbot --nginx -d $DOMAIN -d www.$DOMAIN -d api.$DOMAIN -d metabase.$DOMAIN -m $EMAIL --agree-tos --non-interactive"
echo "3. Validate health endpoints and HTTPS redirects"
