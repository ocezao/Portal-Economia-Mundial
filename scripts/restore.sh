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
BACKUP_DIR="/var/www/pem-backups"

# Supabase credentials
SUPABASE_DB_URL=${SUPABASE_DB_URL:-""}

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
        echo "Restoring database..."
        
        if [ -z "$SUPABASE_DB_URL" ]; then
            if [ -f "/var/www/pem/.env" ]; then
                SUPABASE_DB_URL=$(grep SUPABASE_DB_URL /var/www/pem/.env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
            fi
        fi
        
        if [ -z "$SUPABASE_DB_URL" ]; then
            echo "ERROR: SUPABASE_DB_URL not set"
            exit 1
        fi
        
        echo "Dropping existing tables..."
        # WARNING: This is destructive
        gunzip -c $BACKUP_FILE | psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1
        
        echo "Database restored successfully!"
        ;;
        
    "uploads")
        echo "Restoring uploads..."
        
        # Create temp directory
        TEMP_DIR=$(mktemp -d)
        tar -xzf $BACKUP_FILE -C $TEMP_DIR
        
        echo "Files extracted to: $TEMP_DIR"
        echo "Manual upload to Supabase Storage required:"
        echo "  1. Go to Supabase Dashboard > Storage > uploads"
        echo "  2. Upload files from $TEMP_DIR"
        echo ""
        echo "Or use Supabase CLI:"
        echo "  supabase storage upload uploads $TEMP_DIR/*"
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
