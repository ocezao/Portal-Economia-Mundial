#!/bin/bash
#
# Restores code from a tar backup and recreates the Docker stack.
#
# Usage: ./scripts/rollback.sh [backup_file]

set -euo pipefail

PROJECT_DIR=${PROJECT_DIR:-/var/www/portal}
BACKUP_DIR=${BACKUP_DIR:-/var/www/portal-backups}
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.yml}

if [ -n "${1:-}" ]; then
  BACKUP_FILE=$1
else
  BACKUP_FILE=$(ls -t "$BACKUP_DIR"/pre-deploy-*.tar.gz 2>/dev/null | head -n1)
fi

if [ -z "${BACKUP_FILE:-}" ]; then
  echo "ERROR: No backup file found"
  exit 1
fi

echo "Using backup: $BACKUP_FILE"
read -r -p "Continue with rollback? (y/N) " REPLY
if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
  echo "Rollback cancelled"
  exit 0
fi

cd "$PROJECT_DIR"
EMERGENCY_BACKUP="$BACKUP_DIR/emergency-$(date +%Y%m%d_%H%M%S).tar.gz"

tar -czf "$EMERGENCY_BACKUP" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  . 2>/dev/null || echo "Warning: emergency backup had issues"

docker compose -f "$COMPOSE_FILE" stop web api collector metabase || true

find "$PROJECT_DIR" -mindepth 1 -maxdepth 1 \
  ! -name '.env' \
  ! -name 'public' \
  ! -name 'backups' \
  -exec rm -rf {} +
tar -xzf "$BACKUP_FILE" -C "$PROJECT_DIR"
docker compose -f "$COMPOSE_FILE" up -d --build database web api collector metabase metabase-db

echo "Rollback completed. Emergency backup: $EMERGENCY_BACKUP"
