#!/bin/bash
#
# Official production deploy flow using Docker Compose and the local PostgreSQL stack.
#
# Usage: ./scripts/deploy.sh [branch]

set -euo pipefail

BRANCH=${1:-main}
PROJECT_DIR=${PROJECT_DIR:-/var/www/portal}
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.yml}
BACKUP_DIR=${BACKUP_DIR:-/var/www/portal-backups}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WEB_HEALTH_URL=${WEB_HEALTH_URL:-http://127.0.0.1:3000/api/health}
API_HEALTH_URL=${API_HEALTH_URL:-http://127.0.0.1:4000/api/health}
COLLECTOR_HEALTH_URL=${COLLECTOR_HEALTH_URL:-http://127.0.0.1:4010/health}
MAX_RETRIES=${MAX_RETRIES:-24}
RETRY_INTERVAL=${RETRY_INTERVAL:-5}

echo "=========================================="
echo "  Deploy - Cenario Internacional"
echo "  Branch: $BRANCH"
echo "  Compose: $COMPOSE_FILE"
echo "  Time: $(date)"
echo "=========================================="

cd "$PROJECT_DIR"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "ERROR: compose file not found: $COMPOSE_FILE"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree is dirty. Refusing in-place deploy."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "[1/6] Creating code backup..."
tar -czf "$BACKUP_DIR/pre-deploy-$TIMESTAMP.tar.gz" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  . 2>/dev/null || echo "Warning: code backup had issues"

echo "[2/6] Pulling latest code..."
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[3/6] Validating deploy prerequisites..."
bash ./scripts/deploy-check.sh --strict

echo "[4/6] Building and recreating containers..."
docker compose -f "$COMPOSE_FILE" up -d --build database web api collector metabase metabase-db

retry_until_ok() {
  local url=$1
  local label=$2
  local retries=0

  until curl -fsS "$url" >/dev/null 2>&1; do
    retries=$((retries + 1))
    if [ "$retries" -ge "$MAX_RETRIES" ]; then
      echo "ERROR: $label did not become ready: $url"
      return 1
    fi
    echo "Waiting for $label... ($retries/$MAX_RETRIES)"
    sleep "$RETRY_INTERVAL"
  done
}

echo "[5/6] Waiting for health endpoints..."
retry_until_ok "$WEB_HEALTH_URL" "web"
retry_until_ok "$API_HEALTH_URL" "api"
retry_until_ok "$COLLECTOR_HEALTH_URL" "collector"

echo "[6/6] Capturing container status..."
docker compose -f "$COMPOSE_FILE" ps
ls -t "$BACKUP_DIR"/pre-deploy-*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm

echo ""
echo "Deploy completed successfully."
