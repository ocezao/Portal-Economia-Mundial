#!/bin/bash
#
# Backup Script for Local PostgreSQL Database
# Creates backups of the local PostgreSQL database
#
# Usage: ./scripts/backup-local-db.sh
#
# Cron example (daily at 2 AM):
# 0 2 * * * /var/www/portal/scripts/backup-local-db.sh >> /var/log/portal/backup.log 2>&1

set -e

BACKUP_DIR="/var/www/portal/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
DB_NAME="portal"
DB_USER="portal_user"

echo "=========================================="
echo "  Backup - Local PostgreSQL Database"
echo "  Time: $(date)"
echo "=========================================="

mkdir -p "$BACKUP_DIR"

DB_BACKUP_FILE="$BACKUP_DIR/portal_db_$TIMESTAMP.sql"

echo "Dumping local database..."
docker exec portal-database pg_dump -U "$DB_USER" "$DB_NAME" > "$DB_BACKUP_FILE"

gzip "$DB_BACKUP_FILE"
DB_BACKUP_FILE="$DB_BACKUP_FILE.gz"

echo "Database backup created: $DB_BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_DIR/portal_db_$TIMESTAMP.sql.gz" | cut -f1)"

echo ""
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "portal_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

echo ""
echo "Current backups:"
ls -lh "$BACKUP_DIR"/portal_db_*.sql.gz 2>/dev/null || echo "No backups found"

echo ""
echo "=========================================="
echo "  Backup completed!"
echo "=========================================="
