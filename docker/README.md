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

-   **Host**: localhost
-   **Port**: 5432
-   **Database**: hathi_db
-   **User**: postgres
-   **Password**: hathi-db-123!

## Notes

-   The database data is persisted in a Docker volume named `docker_postgres_data`
-   The pgvector extension is automatically installed and available
-   The database is ready to accept connections once the container is started
