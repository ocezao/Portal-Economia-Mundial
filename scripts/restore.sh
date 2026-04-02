#!/bin/bash
#
# Restore Script for Cenario Internacional
# Restores database or uploads from backup
#
# Usage: ./scripts/restore.sh [type] [backup_file]
#   type: db, uploads
#   backup_file: specific backup file (optional)

set -e

RESTORE_TYPE=${1:-"db"}
PROJECT_DIR="/var/www/portal"
BACKUP_DIR="/var/www/portal-backups"
DB_CONTAINER="${DB_CONTAINER:-portal-database}"
DB_NAME="${DB_NAME:-portal}"
DB_USER="${DB_USER:-portal_user}"
UPLOADS_DIR="$PROJECT_DIR/public/uploads"

echo "=========================================="
echo "  Restore - Cenario Internacional"
echo "  Type: $RESTORE_TYPE"
echo "=========================================="

# List available backups
echo "Available backups:"
case $RESTORE_TYPE in
    "db")
        ls -lt $BACKUP_DIR/db-*.sql.gz 2>/dev/null || echo "No database backups found"
        ;;
    "uploads")
        ls -lt $BACKUP_DIR/uploads-*.tar.gz 2>/dev/null || echo "No uploads backups found"
        ;;
esac
echo ""

# Get backup file
if [ -n "$2" ]; then
    BACKUP_FILE=$2
else
    case $RESTORE_TYPE in
        "db")
            BACKUP_FILE=$(ls -t $BACKUP_DIR/db-*.sql.gz 2>/dev/null | head -n1)
            ;;
        "uploads")
            BACKUP_FILE=$(ls -t $BACKUP_DIR/uploads-*.tar.gz 2>/dev/null | head -n1)
            ;;
    esac
fi

if [ -z "$BACKUP_FILE" ]; then
    echo "ERROR: No backup file found"
    exit 1
fi

echo "Using backup: $BACKUP_FILE"
echo ""
read -p "WARNING: This will overwrite current data. Continue? (yes/N) " -r
echo ""

if [ "$REPLY" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Execute restore
case $RESTORE_TYPE in
    "db")
        echo "Restoring database into container $DB_CONTAINER..."
        gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1
        echo "Database restored successfully!"
        ;;
        
    "uploads")
        echo "Restoring uploads..."

        mkdir -p "$UPLOADS_DIR"
        find "$UPLOADS_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
        tar -xzf "$BACKUP_FILE" -C "$UPLOADS_DIR"

        echo "Uploads restored to $UPLOADS_DIR"
        ;;
        
    *)
        echo "ERROR: Unknown restore type: $RESTORE_TYPE"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "  Restore completed!"
echo "=========================================="
