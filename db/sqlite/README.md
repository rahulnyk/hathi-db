# SQLite Backend for Hathi-DB

This directory contains the SQLite implementation of the Hathi-DB backend, which provides an embedded database option as an alternative to PostgreSQL.

## Features

-   **SQLite with sqlite-vec**: Uses SQLite as the main database with sqlite-vec extension for vector operations
-   **Schema Compatibility**: Mirrors the PostgreSQL schema structure with SQLite-compatible types
-   **Vector Search**: Implements semantic search using sqlite-vec for embeddings
-   **JSON Support**: Stores arrays (tags, contexts) as JSON strings in SQLite
-   **Performance Optimized**: Uses WAL mode, optimized pragmas, and proper indexing

## File Structure

```
db/embedded/
├── schema.ts              # SQLite schema definition
├── sqlite.ts              # SQLite adapter implementation
├── connection.ts          # Database connection management
├── migrate-runner.ts      # Migration utilities
├── migrate/               # SQL migration files
│   ├── 0000_init.sql     # Database initialization
│   ├── 0001_tables.sql   # Table creation
│   ├── 0002_triggers.sql # Triggers for auto-updates
│   └── 0003_vectors.sql  # Vector table setup
└── seed/
    └── seed-notes.ts     # Sample data seeding
```

## Environment Configuration

Set the `USE_DB` environment variable to switch between backends:

```bash
# Use SQLite (embedded)
export USE_DB=sqlite

# Use PostgreSQL (default)
export USE_DB=postgres
```

## Database Schema Differences

| Feature      | PostgreSQL                 | SQLite                  |
| ------------ | -------------------------- | ----------------------- |
| Primary Keys | `uuid`                     | `TEXT` (UUID as string) |
| Arrays       | `text[]`, `jsonb`          | `TEXT` (JSON string)    |
| Timestamps   | `timestamp with time zone` | `INTEGER` (epoch ms)    |
| Vectors      | `vector(1536)`             | `vec0` virtual table    |
| Indexes      | GIN, btree, ivfflat        | Standard SQLite indexes |

## Usage

### Setup and Migration

```bash
# Generate SQLite migrations
yarn db:sqlite:generate

# Run migrations
yarn db:sqlite:migrate

# Reset database (drop and recreate)
yarn db:sqlite:reset

# Test connection
yarn db:sqlite:test
```

### Data Management

```bash
# Seed with sample data
yarn db:sqlite:seed

# Truncate all tables
yarn db:sqlite:truncate

# Fresh start (truncate + seed)
yarn db:sqlite:fresh
```

### Application Usage

The application automatically uses the SQLite adapter when `USE_DB=sqlite`:

```typescript
// The db instance is automatically configured
import { db } from "@/db";

// All methods work the same regardless of backend
const notes = await db.fetchNotes({ keyContext: "example" });
const results = await db.filterNotes({ hashtags: ["tag1"] });
```

## Vector Search Implementation

SQLite vector search uses the `sqlite-vec` extension:

1. **Embedding Storage**: Vectors are stored in a separate `vec0` virtual table
2. **Search Query**: Uses `vec0 MATCH` with cosine distance
3. **Result Merging**: Combines vector results with note metadata
4. **Similarity Threshold**: Filters results by similarity score

Example vector search query:

```sql
SELECT id, distance
FROM vec0
WHERE vec0 MATCH '[0.1, 0.2, ...]'
AND k = 10
ORDER BY distance ASC
```

## Performance Considerations

### SQLite Optimizations

-   **WAL Mode**: Enabled for better concurrency
-   **Memory Settings**: Optimized cache size and temp storage
-   **Indexes**: Proper indexes on all searchable fields
-   **Pragmas**: Performance-tuned SQLite settings

### Vector Search Performance

-   **Batch Operations**: Efficient batch embedding insertions
-   **Index Strategy**: Uses sqlite-vec's built-in indexing
-   **Memory Usage**: Vectors stored separately to optimize main queries

## Migration from PostgreSQL

To migrate existing PostgreSQL data to SQLite:

1. Export data from PostgreSQL
2. Set `USE_DB=sqlite`
3. Run SQLite migrations
4. Import data with appropriate type conversions:
    - UUIDs as strings
    - Arrays as JSON strings
    - Timestamps as epoch milliseconds

## Limitations

-   **Vector Dimensions**: Limited to 1536 dimensions (OpenAI embeddings)
-   **Concurrent Writes**: SQLite has limited write concurrency vs PostgreSQL
-   **Extensions**: Requires sqlite-vec extension to be available
-   **File Storage**: Database stored as single file in `./data/hathi.db`

## Development

### Adding New Migrations

1. Create new `.sql` file in `migrate/` directory
2. Follow naming convention: `XXXX_description.sql`
3. Test migration with `yarn db:sqlite:migrate`

### Schema Changes

1. Update `schema.ts` with new fields
2. Generate migration: `yarn db:sqlite:generate`
3. Review generated SQL in `migrate/` directory
4. Test with development data

### Testing

```bash
# Test SQLite functionality
USE_DB=sqlite yarn test

# Compare with PostgreSQL
USE_DB=postgres yarn test
```

## Troubleshooting

### Common Issues

1. **sqlite-vec not found**: Ensure the extension is properly installed
2. **Permission errors**: Check write permissions for `./data/` directory
3. **Migration failures**: Verify SQL syntax compatibility with SQLite
4. **Vector search errors**: Confirm vec0 table exists and is populated

### Debug Mode

Enable verbose logging:

```bash
DEBUG=1 USE_DB=sqlite yarn dev
```

### Database Inspection

```bash
# Open SQLite database directly
sqlite3 ./data/hathi.db

# View schema
.schema

# Check vector table
SELECT COUNT(*) FROM vec0;
```
