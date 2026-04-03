#!/bin/bash
# ============================================
# VPS Provisioning Script (EXEMPLO SEM SECRETS)
# Portal Economico Mundial
# ============================================

set -e

VPS_IP="SEU_IP"
DOMAIN="SEU_DOMINIO"
REPO_URL="https://github.com/ocezao/Portal-Economia-Mundial.git"
APP_DIR="/var/www/portal"

echo "Provisionando em $APP_DIR (dominio: $DOMAIN)"

mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [ ! -d ".git" ]; then
  git clone "$REPO_URL" .
fi

git checkout main

cat > "$APP_DIR/.env" << 'EOF'
# URLs
NEXT_PUBLIC_SITE_URL=https://SEU_DOMINIO
NEXT_PUBLIC_API_BASE_URL=https://SEU_DOMINIO/api

# Banco local e auth
DATABASE_URL=postgresql://usuario:senha@localhost:5432/portal
AUTH_SESSION_SECRET=INSIRA_AQUI
UPLOADS_DIR=/var/www/cenariointernacional/public/uploads

# APIs Externas
GNEWS_API_KEY=INSIRA_AQUI
NEXT_PUBLIC_FINNHUB_API_KEY=INSIRA_AQUI
FINNHUB_API_KEY=INSIRA_AQUI

# OneSignal
NEXT_PUBLIC_ONESIGNAL_APP_ID=INSIRA_AQUI
ONESIGNAL_REST_API_KEY=INSIRA_AQUI

# AdSense
NEXT_PUBLIC_ADSENSE_CLIENT_ID=INSIRA_AQUI
NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE=INSIRA_AQUI

# CORS
CORS_ALLOWED_ORIGINS=https://SEU_DOMINIO,https://www.SEU_DOMINIO

# PostgreSQL
POSTGRES_PASSWORD=INSIRA_AQUI_SENHA_FORTE
EOF

chmod 600 "$APP_DIR/.env"
chown root:root "$APP_DIR/.env"

echo "OK. Proximo passo: docker compose -f docker-compose.prod.yml up -d"
