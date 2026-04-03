#!/bin/bash
#
# Restore Script for Cenario Internacional
# Restores database or local uploads from backup
#
# Usage: ./scripts/restore.sh [type] [backup_file]

set -e

RESTORE_TYPE=${1:-"db"}
BACKUP_DIR="/var/www/pem-backups"
DATABASE_URL=${DATABASE_URL:-""}
UPLOADS_DIR=${UPLOADS_DIR:-"/var/www/pem/public/uploads"}

case $RESTORE_TYPE in
    "db")
        ls -lt "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null || echo "No database backups found"
        ;;
    "uploads")
        ls -lt "$BACKUP_DIR"/uploads-*.tar.gz 2>/dev/null || echo "No uploads backups found"
        ;;
esac

if [ -n "${2:-}" ]; then
    BACKUP_FILE=$2
else
    case $RESTORE_TYPE in
        "db")
            BACKUP_FILE=$(ls -t "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null | head -n1)
            ;;
        "uploads")
            BACKUP_FILE=$(ls -t "$BACKUP_DIR"/uploads-*.tar.gz 2>/dev/null | head -n1)
            ;;
    esac
fi

if [ -z "${BACKUP_FILE:-}" ]; then
    echo "ERROR: No backup file found"
    exit 1
fi

read -p "WARNING: This will overwrite current data. Continue? (yes/N) " -r
echo ""
if [ "$REPLY" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

case $RESTORE_TYPE in
    "db")
        if [ -z "$DATABASE_URL" ] && [ -f "/var/www/pem/.env" ]; then
            DATABASE_URL=$(grep DATABASE_URL /var/www/pem/.env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        fi

        if [ -z "$DATABASE_URL" ]; then
            echo "ERROR: DATABASE_URL not set"
            exit 1
        fi

        gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL" -v ON_ERROR_STOP=1
        ;;
    "uploads")
        mkdir -p "$UPLOADS_DIR"
        tar -xzf "$BACKUP_FILE" -C "$UPLOADS_DIR"
        ;;
    *)
        echo "ERROR: Unknown restore type: $RESTORE_TYPE"
        exit 1
        ;;
esac

echo "Restore completed"
