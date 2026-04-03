#!/bin/bash
#
# Backup Script for Cenario Internacional
# Creates backups of database and local uploads
#
# Usage: ./scripts/backup.sh [type]
#   type: full (default), db, uploads

set -e

BACKUP_TYPE=${1:-full}
BACKUP_DIR="/var/www/pem-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

DATABASE_URL=${DATABASE_URL:-""}
UPLOADS_DIR=${UPLOADS_DIR:-"/var/www/pem/public/uploads"}

S3_ENABLED=${S3_BACKUP_ENABLED:-"false"}
S3_BUCKET=${S3_BACKUP_BUCKET:-""}
S3_ENDPOINT=${S3_BACKUP_ENDPOINT:-""}
S3_ACCESS_KEY=${S3_BACKUP_ACCESS_KEY:-""}
S3_SECRET_KEY=${S3_BACKUP_SECRET_KEY:-""}

mkdir -p "$BACKUP_DIR"

upload_to_s3() {
    local file=$1
    local remote_path=$2

    if [ "$S3_ENABLED" = "true" ] && [ -n "$S3_BUCKET" ]; then
        if command -v aws &> /dev/null; then
            aws s3 cp "$file" "s3://$S3_BUCKET/$remote_path" --endpoint-url="$S3_ENDPOINT" --no-progress
        elif command -v rclone &> /dev/null; then
            rclone copy "$file" "remote:$S3_BUCKET/$remote_path"
        else
            echo "Warning: aws-cli/rclone nao encontrados; pulando upload S3"
        fi
    fi
}

backup_database() {
    echo "[DB] Starting database backup..."

    if [ -z "$DATABASE_URL" ] && [ -f "/var/www/pem/.env" ]; then
        DATABASE_URL=$(grep DATABASE_URL /var/www/pem/.env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    fi

    if [ -z "$DATABASE_URL" ]; then
        echo "ERROR: DATABASE_URL not set"
        return 1
    fi

    DB_BACKUP_FILE="$BACKUP_DIR/db-$TIMESTAMP.sql.gz"
    pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "$DB_BACKUP_FILE"
    upload_to_s3 "$DB_BACKUP_FILE" "db/db-$TIMESTAMP.sql.gz"
}

backup_uploads() {
    echo "[UPLOADS] Starting uploads backup..."

    if [ ! -d "$UPLOADS_DIR" ]; then
        echo "Warning: uploads dir nao encontrado: $UPLOADS_DIR"
        return 0
    fi

    UPLOADS_BACKUP_FILE="$BACKUP_DIR/uploads-$TIMESTAMP.tar.gz"
    tar -czf "$UPLOADS_BACKUP_FILE" -C "$UPLOADS_DIR" .
    upload_to_s3 "$UPLOADS_BACKUP_FILE" "uploads/uploads-$TIMESTAMP.tar.gz"
}

case $BACKUP_TYPE in
    "db")
        backup_database
        ;;
    "uploads")
        backup_uploads
        ;;
    "full"|*)
        backup_database
        backup_uploads
        ;;
esac

find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

echo "Backup completed"
