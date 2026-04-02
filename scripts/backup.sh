#!/bin/bash
#
# Creates backups of the local PostgreSQL database and persisted uploads.
#
# Usage: ./scripts/backup.sh [type]

set -euo pipefail

BACKUP_TYPE=${1:-full}
PROJECT_DIR=${PROJECT_DIR:-/var/www/portal}
BACKUP_DIR=${BACKUP_DIR:-/var/www/portal-backups}
DB_CONTAINER=${DB_CONTAINER:-portal-database}
DB_NAME=${DB_NAME:-portal}
DB_USER=${DB_USER:-portal_user}
UPLOADS_DIR=${UPLOADS_DIR:-$PROJECT_DIR/public/uploads}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${RETENTION_DAYS:-30}

mkdir -p "$BACKUP_DIR"

backup_database() {
  local db_backup_file="$BACKUP_DIR/db-$TIMESTAMP.sql.gz"
  docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$db_backup_file"
  echo "Database backup created: $db_backup_file"
}

backup_uploads() {
  local uploads_backup_file="$BACKUP_DIR/uploads-$TIMESTAMP.tar.gz"
  if [ ! -d "$UPLOADS_DIR" ]; then
    echo "Warning: uploads directory not found: $UPLOADS_DIR"
    return 0
  fi
  tar -czf "$uploads_backup_file" -C "$UPLOADS_DIR" .
  echo "Uploads backup created: $uploads_backup_file"
}

case "$BACKUP_TYPE" in
  db)
    backup_database
    ;;
  uploads)
    backup_uploads
    ;;
  full|*)
    backup_database
    backup_uploads
    ;;
esac

find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
