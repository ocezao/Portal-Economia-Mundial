#!/bin/bash
# ============================================
# VPS Provisioning Script (EXEMPLO SEM SECRETS)
# Portal Economico Mundial
# ============================================
#
# ATENCAO:
# - Este arquivo e seguro para versionar (nao contem chaves reais).
# - Crie um arquivo local `scripts/vps-provision.sh` com valores reais.
#   Esse arquivo real esta no `.gitignore` e NAO deve ser commitado.

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

# Banco local
DB_NAME=portal
DB_USER=portal_user
DB_PASSWORD=INSIRA_AQUI_SENHA_FORTE
METABASE_DB_PASSWORD=INSIRA_AQUI_OUTRA_SENHA_FORTE
LOCAL_AUTH_SECRET=INSIRA_AQUI
CRON_API_SECRET=INSIRA_AQUI
EDITORIAL_API_KEY=INSIRA_AQUI

# APIs Externas
GNEWS_API_KEY=INSIRA_AQUI
FINNHUB_API_KEY=INSIRA_AQUI

# OneSignal
NEXT_PUBLIC_ONESIGNAL_APP_ID=INSIRA_AQUI
ONESIGNAL_REST_API_KEY=INSIRA_AQUI

# AdSense
NEXT_PUBLIC_ADSENSE_CLIENT_ID=INSIRA_AQUI
NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE=INSIRA_AQUI

# CORS
CORS_ALLOWED_ORIGINS=https://SEU_DOMINIO,https://www.SEU_DOMINIO
EOF

chmod 600 "$APP_DIR/.env"
chown root:root "$APP_DIR/.env"

echo "OK. Proximo passo: docker compose -f docker-compose.yml up -d --build"
