#!/bin/bash
#
# Nginx Setup Script for Cenario Internacional
# Run on VPS as root or with sudo
#
# Usage: ./scripts/nginx-setup.sh

set -e

DOMAIN="cenariointernacional.com.br"
EMAIL="contato@cenariointernacional.com.br"
PROJECT_DIR="/var/www/portal"

echo "=========================================="
echo "  Nginx Setup - Cenario Internacional"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: Please run as root or with sudo"
    exit 1
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "[1/8] Installing Nginx..."
    apt update
    apt install -y nginx
else
    echo "[1/8] Nginx already installed"
fi

# Install Certbot
if ! command -v certbot &> /dev/null; then
    echo "[2/8] Installing Certbot..."
    apt install -y certbot python3-certbot-nginx
else
    echo "[2/8] Certbot already installed"
fi

# Create project directory if not exists
echo "[3/8] Creating project directory..."
mkdir -p $PROJECT_DIR/public
mkdir -p /var/www/certbot

# Copy Nginx configuration
echo "[4/8] Copying Nginx configuration..."
cp nginx/pem.conf /etc/nginx/sites-available/pem
cp nginx/ssl.conf /etc/nginx/ssl.conf

# Remove default site if exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    echo "Removed default Nginx site"
fi

# Enable site
echo "[5/8] Enabling site..."
ln -sf /etc/nginx/sites-available/pem /etc/nginx/sites-enabled/pem

# Create cache directory
echo "[6/8] Creating cache directories..."
mkdir -p /var/cache/nginx/static_cache
chown -R www-data:www-data /var/cache/nginx

# Create log directory
mkdir -p /var/log/nginx
chown -R www-data:www-data /var/log/nginx

# Test Nginx configuration
echo "[7/8] Testing Nginx configuration..."
if nginx -t; then
    echo "Nginx configuration OK"
else
    echo "ERROR: Nginx configuration failed"
    exit 1
fi

# Reload Nginx
echo "[8/8] Reloading Nginx..."
systemctl reload nginx
systemctl enable nginx

echo ""
echo "=========================================="
echo "  Nginx setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Make sure DNS is pointing to this server"
echo "2. Run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "3. Start the application stack: docker compose -f $PROJECT_DIR/docker-compose.yml up -d --build"
echo ""
echo "To check status:"
echo "  sudo systemctl status nginx"
echo "  sudo nginx -t"
echo ""
