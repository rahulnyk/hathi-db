# Docker Setup for Hathi-DB

This directory contains Docker configuration files for running the PostgreSQL database locally.

## Files

-   `docker-compose.yml` - Docker Compose configuration for PostgreSQL with pgvector
-   `Dockerfile.postgres` - Custom PostgreSQL Dockerfile with pgvector extension
-   `init-pgvector.sql` - Initialization script for pgvector extension

## Usage

### Start the Database

```bash
cd docker
docker-compose up -d
```

### Stop the Database

```bash
cd docker
docker-compose down
```

### Reset Database (remove all data)

```bash
cd docker
docker-compose down -v
docker-compose up -d
```

### View Logs

```bash
cd docker
docker-compose logs -f
```

## Connection Details

### Main Database (Development)

-   **Host**: localhost
-   **Port**: 5432
-   **Database**: hathi_db
-   **User**: postgres
-   **Password**: hathi-db-123!

### Test Database

-   **Host**: localhost
-   **Port**: 5432
-   **Database**: hathi_db_test
-   **User**: postgres
-   **Password**: hathi-db-123!

## Database Setup

The Docker setup automatically creates two databases:

1. **hathi_db** - Main development database
2. **hathi_db_test** - Test database (isolated from development data)

Both databases have the pgvector extension enabled for semantic search functionality.

## Testing the Setup

After starting the container, you can verify both databases were created:

```bash
# Connect to the main database
docker exec -it hathi-db-postgres psql -U postgres -d hathi_db -c "\l"

# Connect to the test database
docker exec -it hathi-db-postgres psql -U postgres -d hathi_db_test -c "\l"

# Verify pgvector extension is available in both databases
docker exec -it hathi-db-postgres psql -U postgres -d hathi_db -c "\dx"
docker exec -it hathi-db-postgres psql -U postgres -d hathi_db_test -c "\dx"
```

## Environment Variables

The setup uses these environment variables for database configuration:

```env
# Main database (development)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=hathi-db-123!
POSTGRES_DB=hathi_db

# Test database
POSTGRES_DB=hathi_db_test
```

## Database Management Commands

### Main Database (hathi_db)

```bash
# Setup and migration
yarn db:migrate        # Run migrations
yarn db:reset          # Drop all tables and re-run migrations
yarn db:test           # Test connection

# Data management
yarn db:truncate       # Remove all data (keep schema)
yarn db:seed           # Add sample data
yarn db:fresh          # Truncate + seed

# Inspection
yarn db:tables         # List tables
yarn db:schema         # Show schemas
yarn db:data notes 10  # Show table data
```

### Test Database (hathi_db_test)

```bash
# Setup and migration
yarn db:test:migrate   # Run migrations on test DB
yarn db:test:reset     # Reset test database
yarn db:test:truncate  # Clear test database

# Note: Seeding commands use main DB credentials by default
# For test DB operations, use environment variables:
POSTGRES_DB=hathi_db_test yarn db:seed
```

## Notes

-   The database data is persisted in a Docker volume named `docker_postgres_data`
-   The pgvector extension is automatically installed and available
-   The database is ready to accept connections once the container is started
