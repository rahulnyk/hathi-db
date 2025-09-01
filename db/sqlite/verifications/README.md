# SQLite Verification Scripts

This directory contains verification and testing scripts for the SQLite database implementation with embedding functionality.

## Files

### `test-sqlite-embedding.js`

-   Tests basic SQLite embedding functionality
-   Creates test notes and embeddings
-   Verifies storage and retrieval of embeddings
-   Tests search functionality

### `verify-embeddings.ts`

-   Comprehensive verification of embedding storage
-   Checks embedding metadata in notes table
-   Tests semantic search functionality
-   Provides detailed embedding statistics

### `verify-seeding.js` / `verify-seeding.ts`

-   Verifies database seeding functionality
-   Checks note and context counts
-   Displays sample data for verification

### `verify-sqlite-implementation.js`

-   Implementation verification script
-   Checks for required methods in SQLite adapter
-   Validates migration files
-   Provides implementation summary

### `final-verification.ts`

-   Final verification of unified schema implementation
-   Verifies embeddings are stored in notes table (not separate table)
-   Confirms schema consistency with PostgreSQL
-   Tests semantic search with unified schema
-   Checks for removal of old separate embedding table

## Usage

Run these scripts from the project root directory:

```bash
# Test embedding functionality
node db/sqlite/verifications/test-sqlite-embedding.js

# Verify embeddings (TypeScript)
tsx db/sqlite/verifications/verify-embeddings.ts

# Verify seeding (JavaScript)
node db/sqlite/verifications/verify-seeding.js

# Verify seeding (TypeScript)
tsx db/sqlite/verifications/verify-seeding.ts

# Verify implementation
node db/sqlite/verifications/verify-sqlite-implementation.js

# Final verification of unified schema
tsx db/sqlite/verifications/final-verification.ts
```

## Environment

Make sure to set `USE_DB=sqlite` environment variable when running these tests to ensure they use the SQLite database.

## Dependencies

-   TypeScript scripts require `tsx` to be installed
-   All scripts use the project's database configuration and schema
