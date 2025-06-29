#!/bin/bash

# Simple Database Migration Script
# This script runs SQL migrations in order

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIGRATION_DIR="migrations"

# Help function
show_help() {
    echo "Simple Database Migration Script"
    echo ""
    echo "Usage: $0 COMMAND"
    echo ""
    echo "Commands:"
    echo "  up                    Run all migrations in order"
    echo "  reset                 Drop all tables and run migrations fresh"
    echo "  create NAME           Create a new migration file"
    echo ""
    echo "Environment variables:"
    echo "  DATABASE_URL          PostgreSQL connection string"
    echo "  SUPABASE_DB_URL       Supabase database URL (alternative to DATABASE_URL)"
    echo ""
    echo "Examples:"
    echo "  $0 up                 # Run all migrations"
    echo "  $0 create add_users   # Create new migration file"
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Check requirements
check_requirements() {
    if ! command -v psql &> /dev/null; then
        log_error "psql is required but not installed. Please install PostgreSQL client."
        exit 1
    fi

    if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
        log_error "DATABASE_URL or SUPABASE_DB_URL environment variable is required"
        log_error "Set one of these variables with your database connection string:"
        log_error "  export DATABASE_URL=\"postgresql://user:pass@host:port/database\""
        log_error "  export SUPABASE_DB_URL=\"postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres\""
        exit 1
    fi

    # Use SUPABASE_DB_URL if DATABASE_URL is not set
    if [ -z "$DATABASE_URL" ] && [ -n "$SUPABASE_DB_URL" ]; then
        DATABASE_URL="$SUPABASE_DB_URL"
    fi

    if [ ! -d "$MIGRATION_DIR" ]; then
        log_error "Migration directory '$MIGRATION_DIR' not found"
        exit 1
    fi
}

# Execute SQL file
execute_sql_file() {
    local file="$1"
    local filename=$(basename "$file")
    
    if [ ! -f "$file" ]; then
        log_error "Migration file not found: $file"
        return 1
    fi
    
    log_info "Running migration: $filename"
    
    # Capture both stdout and stderr for better error reporting
    local output
    if output=$(psql "$DATABASE_URL" -f "$file" 2>&1); then
        log_success "✓ $filename"
        return 0
    else
        log_error "✗ Failed: $filename"
        log_error "Error details:"
        echo "$output" | while IFS= read -r line; do
            log_error "  $line"
        done
        return 1
    fi
}

# Run all migrations
migrate_up() {
    log_info "Running migrations..."
    
    local migration_files=()
    for file in "$MIGRATION_DIR"/*.sql; do
        if [ -f "$file" ]; then
            # Skip .down.sql files
            if [[ "$file" != *.down.sql ]]; then
                migration_files+=("$file")
            fi
        fi
    done
    
    if [ ${#migration_files[@]} -eq 0 ]; then
        log_info "No migration files found"
        return 0
    fi
    
    # Sort files to ensure they run in order
    IFS=$'\n' migration_files=($(sort <<<"${migration_files[*]}"))
    unset IFS
    
    local count=0
    for migration_file in "${migration_files[@]}"; do
        if execute_sql_file "$migration_file"; then
            ((count++))
        else
            log_error "Migration failed. Stopping execution."
            exit 1
        fi
    done
    
    log_success "Completed $count migration(s)"
}

# Create new migration file
create_migration() {
    local name="$1"
    
    if [ -z "$name" ]; then
        log_error "Migration name is required"
        log_error "Usage: $0 create migration_name"
        exit 1
    fi
    
    local timestamp=$(date +"%Y%m%d%H%M%S")
    local migration_file="$MIGRATION_DIR/${timestamp}_${name}.sql"
    
    # Create migration file
    cat > "$migration_file" << EOF
-- Migration: $name
-- Created: $(date)

-- Add your SQL migration here
-- Example:
-- CREATE TABLE users (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     email VARCHAR(255) UNIQUE NOT NULL,
--     created_at TIMESTAMPTZ DEFAULT now()
-- );

EOF
    
    log_success "Created migration file: $migration_file"
    log_info "Edit the file and add your SQL, then run: $0 up"
}

# Reset database (drop all tables)
reset_database() {
    log_info "Dropping all tables in public schema..."
    
    psql "$DATABASE_URL" -c "
    DO \$\$ 
    DECLARE
        r RECORD;
    BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
    END \$\$;" > /dev/null 2>&1
    
    log_success "Tables dropped. Running migrations..."
    migrate_up
}

# Parse command line arguments
COMMAND="$1"

if [ -z "$COMMAND" ] || [ "$COMMAND" = "help" ] || [ "$COMMAND" = "--help" ] || [ "$COMMAND" = "-h" ]; then
    show_help
    exit 0
fi

# Main execution
case $COMMAND in
    up)
        check_requirements
        migrate_up
        ;;
    reset)
        check_requirements
        reset_database
        ;;
    create)
        create_migration "$2"
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac