#!/bin/bash
#
# Backup Script for Cenario Internacional
# Creates backups of database and uploads
#
# Usage: ./scripts/backup.sh [type]
#   type: full (default), db, uploads
#
# Cron example (daily at 2 AM):
# 0 2 * * * /var/www/pem/scripts/backup.sh full >> /var/log/pem/backup.log 2>&1

set -e

BACKUP_TYPE=${1:-full}
BACKUP_DIR="/var/www/pem-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Supabase credentials (from environment or .env)
SUPABASE_URL=${SUPABASE_URL:-""}
SUPABASE_DB_URL=${SUPABASE_DB_URL:-""}
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-""}

# S3/Backblaze B2 configuration (optional)
S3_ENABLED=${S3_BACKUP_ENABLED:-"false"}
S3_BUCKET=${S3_BACKUP_BUCKET:-""}
S3_ENDPOINT=${S3_BACKUP_ENDPOINT:-""}
S3_ACCESS_KEY=${S3_BACKUP_ACCESS_KEY:-""}
S3_SECRET_KEY=${S3_BACKUP_SECRET_KEY:-""}

echo "=========================================="
echo "  Backup - Cenario Internacional"
echo "  Type: $BACKUP_TYPE"
echo "  Time: $(date)"
echo "=========================================="

mkdir -p $BACKUP_DIR

# Function: Upload to S3
upload_to_s3() {
    local file=$1
    local remote_path=$2
    
    if [ "$S3_ENABLED" = "true" ] && [ -n "$S3_BUCKET" ]; then
        echo "Uploading to S3: $remote_path"
        if command -v aws &> /dev/null; then
            aws s3 cp $file s3://$S3_BUCKET/$remote_path \
                --endpoint-url=$S3_ENDPOINT \
                --no-progress
        elif command -v rclone &> /dev/null; then
            rclone copy $file remote:$S3_BUCKET/$remote_path
        else
            echo "Warning: Neither aws-cli nor rclone found, skipping S3 upload"
        fi
    fi
}

# Function: Backup Database
backup_database() {
    echo "[DB] Starting database backup..."
    
    if [ -z "$SUPABASE_DB_URL" ]; then
        echo "Warning: SUPABASE_DB_URL not set, using pg_dump with local config"
        # Try to read from .env file
        if [ -f "/var/www/pem/.env" ]; then
            SUPABASE_DB_URL=$(grep SUPABASE_DB_URL /var/www/pem/.env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        fi
    fi
    
    DB_BACKUP_FILE="$BACKUP_DIR/db-$TIMESTAMP.sql.gz"
    
    if [ -n "$SUPABASE_DB_URL" ]; then
        echo "Dumping database from Supabase..."
        pg_dump "$SUPABASE_DB_URL" --no-owner --no-acl | gzip > $DB_BACKUP_FILE
    else
        echo "Warning: No database URL configured"
        echo "To backup Supabase, set SUPABASE_DB_URL environment variable"
        return 1
    fi
    
    echo "Database backup created: $DB_BACKUP_FILE"
    echo "Size: $(du -h $DB_BACKUP_FILE | cut -f1)"
    
    upload_to_s3 $DB_BACKUP_FILE "db/db-$TIMESTAMP.sql.gz"
}

# Function: Backup Uploads (Supabase Storage)
backup_uploads() {
    echo "[UPLOADS] Starting uploads backup..."
    
    UPLOADS_BACKUP_DIR="$BACKUP_DIR/uploads-$TIMESTAMP"
    mkdir -p $UPLOADS_BACKUP_DIR
    
    # Using Supabase CLI if available
    if command -v supabase &> /dev/null; then
        echo "Using Supabase CLI to download storage..."
        # Note: This requires supabase login and project link
        # supabase storage download uploads $UPLOADS_BACKUP_DIR
        echo "Warning: Supabase CLI storage operations require manual setup"
    fi
    
    # Alternative: Use Supabase API to list and download files
    if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_KEY" ]; then
        echo "Downloading files from Supabase Storage..."
        
        # List files in uploads bucket
        FILES=$(curl -s -X GET \
            "${SUPABASE_URL}/storage/v1/object/list/uploads" \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
            -H "apikey: ${SUPABASE_SERVICE_KEY}" \
            | jq -r '.[].name' 2>/dev/null || echo "")
        
        if [ -n "$FILES" ]; then
            for FILE in $FILES; do
                echo "Downloading: $FILE"
                curl -s -o "$UPLOADS_BACKUP_DIR/$FILE" \
                    "${SUPABASE_URL}/storage/v1/object/public/uploads/${FILE}" || true
            done
        else
            echo "No files found or error listing files"
        fi
    else
        echo "Warning: Supabase credentials not configured"
    fi
    
    # Create archive
    UPLOADS_BACKUP_FILE="$BACKUP_DIR/uploads-$TIMESTAMP.tar.gz"
    if [ "$(ls -A $UPLOADS_BACKUP_DIR 2>/dev/null)" ]; then
        tar -czf $UPLOADS_BACKUP_FILE -C $UPLOADS_BACKUP_DIR .
        rm -rf $UPLOADS_BACKUP_DIR
        echo "Uploads backup created: $UPLOADS_BACKUP_FILE"
        echo "Size: $(du -h $UPLOADS_BACKUP_FILE | cut -f1)"
        upload_to_s3 $UPLOADS_BACKUP_FILE "uploads/uploads-$TIMESTAMP.tar.gz"
    else
        echo "No uploads to backup"
        rm -rf $UPLOADS_BACKUP_DIR
    fi
}

# Execute based on backup type
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

# Cleanup old backups
echo ""
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# List current backups
echo ""
echo "Current backups:"
ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null || echo "No database backups"
ls -lh $BACKUP_DIR/uploads-*.tar.gz 2>/dev/null || echo "No uploads backups"

echo ""
echo "=========================================="
echo "  Backup completed!"
echo "=========================================="
