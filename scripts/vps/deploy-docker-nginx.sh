#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/portal"
REPO_URL="https://github.com/ocezao/Portal-Economia-Mundial.git"
BRANCH="main"

echo "[1/8] Preparando diretório ${APP_DIR}"
mkdir -p "${APP_DIR}"
cd "${APP_DIR}"

if [ ! -d ".git" ]; then
  echo "[2/8] Clonando repositório"
  git clone --branch "${BRANCH}" "${REPO_URL}" .
else
  echo "[2/8] Atualizando repositório"
  git fetch origin "${BRANCH}"
  git checkout "${BRANCH}"
  git pull --ff-only origin "${BRANCH}"
fi

echo "[3/8] Validando .env"
test -f .env || { echo "ERRO: arquivo .env não encontrado em ${APP_DIR}"; exit 1; }
chmod 600 .env

echo "[4/8] Subindo containers"
docker compose -f docker-compose.yml --env-file .env up -d --build

echo "[5/8] Copiando configuração Nginx"
cp deploy/nginx/portal.conf /etc/nginx/sites-available/portal
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/portal

echo "[6/8] Validando Nginx"
nginx -t
systemctl reload nginx

echo "[7/8] Garantindo SSL"
certbot --nginx \
  --non-interactive --agree-tos --redirect \
  -m contato@cenariointernacional.com.br \
  -d cenariointernacional.com.br \
  -d www.cenariointernacional.com.br \
  -d api.cenariointernacional.com.br \
  -d metabase.cenariointernacional.com.br

echo "[8/8] Verificações finais"
docker compose -f docker-compose.yml ps
curl -I http://cenariointernacional.com.br
curl -I https://cenariointernacional.com.br
curl -I https://www.cenariointernacional.com.br
curl -I https://api.cenariointernacional.com.br
curl -I https://metabase.cenariointernacional.com.br

echo "Deploy concluído."
