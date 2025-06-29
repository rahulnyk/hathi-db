# Database Migrations

This directory contains SQL migration files for the Hathi-3 application.

## Simple Migration Script Usage

The migration script is located at `scripts/migrate.sh` and provides a simple way to run SQL migrations in order.

### Setup

1. Set your database URL environment variable:
   ```bash
   export DATABASE_URL="postgresql://username:password@localhost:5432/database"
   # OR for Supabase
   export SUPABASE_DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```

2. Ensure PostgreSQL client (`psql`) is installed on your system.

### Commands

#### Run All Migrations
```bash
# Run all migration files in order
./scripts/migrate.sh up
# OR using npm
npm run migrate
```

#### Create New Migration
```bash
# Create a new migration with a descriptive name
./scripts/migrate.sh create add_user_preferences
# OR using npm
npm run migrate:create add_user_preferences
```

### Examples

```bash
# Run all migrations
npm run migrate

# Create a new migration
npm run migrate:create add_user_settings
```

## How It Works

- The script runs all `.sql` files in the `migrations/` directory in alphabetical order
- Files with `.down.sql` extension are ignored (these are kept for reference but not used)
- No migration tracking table is created - the script simply runs all files each time
- Make your migrations idempotent using `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE IF EXISTS`, etc.

## Migration File Naming Convention

Migration files follow this naming pattern:
```
YYYYMMDDHHMMSS_description.sql
```

For example:
- `20250626210000_create_users_table.sql`
- `20250626210100_add_email_to_users.sql`

## Migration File Structure

### Example Migration
```sql
-- Migration: Create users table
-- Created: 2025-06-26

-- Use IF NOT EXISTS for idempotent migrations
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
        CREATE INDEX idx_users_email ON users(email);
    END IF;
END $$;
```

## Best Practices

1. **Make migrations idempotent** - use `IF NOT EXISTS`, `IF EXISTS` conditions
2. **Use descriptive names** for migration files
3. **Test migrations** on a copy of production data first
4. **Keep migrations simple** - one logical change per migration
5. **Add comments** to explain what the migration does

## Environment Variables

- `DATABASE_URL`: Full PostgreSQL connection string
- `SUPABASE_DB_URL`: Alternative for Supabase databases

## Files in this Directory

Current migration files:
- `20250601100000_create_notes_table.sql` - Initial notes table creation
- `20250602100000_add_context_and_tags_to_notes.sql` - Add context and tags
- `20250603100000_add_note_type_column.sql` - Add note type column
- `20250618120000_create_get_user_context_stats_function.sql` - User context stats function
- `20250619100000_add_embedding_to_notes.sql` - Add embedding support
- `20250619130000_add_suggested_contexts_to_notes.sql` - Add suggested contexts

## Troubleshooting

### Common Issues

1. **Connection Error**: Ensure `DATABASE_URL` or `SUPABASE_DB_URL` is correctly set
2. **Permission Error**: Ensure the database user has sufficient privileges
3. **psql Not Found**: Install PostgreSQL client tools

### Getting Your Supabase Database URL

1. Go to your Supabase project dashboard
2. Go to Settings → Database
3. Look for "Connection string" → "URI"
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with your database password

Example:
```bash
export SUPABASE_DB_URL="postgresql://postgres:your-password@db.abcdefghijklmnop.supabase.co:5432/postgres"
```
