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

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=INSIRA_AQUI
SUPABASE_SERVICE_ROLE_KEY=INSIRA_AQUI
SUPABASE_UPLOAD_BUCKET=media

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

# PostgreSQL (para Analytics local, se usar)
POSTGRES_PASSWORD=INSIRA_AQUI_SENHA_FORTE
EOF

chmod 600 "$APP_DIR/.env"
chown root:root "$APP_DIR/.env"

echo "OK. Proximo passo: docker compose -f docker-compose.prod.yml up -d"

