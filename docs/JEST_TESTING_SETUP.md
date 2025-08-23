# Jest Testing Setup Documentation

## Overview

This project now includes a comprehensive Jest testing framework setup for testing our PostgreSQL-based agent tools and filter functions.

## Test Configuration

### Jest Configuration (`jest.config.ts`)

-   **Test Environment**: Node.js (required for PostgreSQL database connections)
-   **Coverage Provider**: v8
-   **Module Name Mapping**: Supports absolute imports with `@/` prefix
-   **Test File Patterns**: `tests/**/*.test.ts` and `tests/**/*.test.tsx`
-   **Setup Files**: Automatically loads environment variables and testing utilities

### Environment Setup (`jest.env.ts`)

-   Sets `NODE_ENV=test` for proper test environment
-   Verifies that required environment variables are loaded by Next.js
-   Provides fallback configuration only if environment variables are missing
-   **Note**: `.env.test.local` is automatically loaded by Next.js Jest integration - no manual loading needed

### Test Database Configuration (`.env.test.local`)

```bash
NODE_ENV=test
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=hathi-db-123!
POSTGRES_DB=hathi_db_test
POSTGRES_DATABASE=hathi_db_test
GOOGLE_AI_API_KEY=test-key-for-jest
LOG_PERF_TO_CSV=false
```

## Available Scripts

### Test Commands

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Reset and seed test database
yarn test:reset
```

### Database Commands for Testing

```bash
# Test database specific commands
yarn db:test:migrate    # Run migrations on test database
yarn db:test:reset      # Reset test database (drop + migrate)
yarn db:test:truncate   # Clear all data from test database
yarn db:test:seed       # Seed test database with sample data
```

## Test Structure

### Test Files Organization

```
tests/
├── setup.test.ts                           # Basic Jest setup verification
├── agent_tools/
│   ├── filter-notes.test.ts                # Core filter function tests
│   ├── filter-notes-edge-cases.test.ts     # Edge case and error handling tests
│   ├── filter-notes-db-only.test.ts        # Database-specific tests
│   └── filter-notes-with-setup.test.ts     # Tests with automatic DB setup
└── utils/
    └── db-helpers.ts                        # Database utility functions for tests
```

### Test Suites

#### 1. `filter-notes.test.ts`

Tests core functionality of the filter-notes functions:

-   ✅ `getFilterOptions()` - Retrieves available filter options
-   ✅ `filterNotes()` with basic limit
-   ✅ Filter by note type, context, status
-   ✅ Date range filtering
-   ✅ Combined filters

#### 2. `filter-notes-edge-cases.test.ts`

Tests edge cases and error handling:

-   ✅ Empty filter parameters
-   ✅ Invalid date filters (future dates, invalid strings)
-   ✅ Non-existent values (contexts, note types, hashtags)
-   ✅ Extreme values (large limits, zero/negative limits)
-   ✅ Empty arrays and mixed valid/invalid values

#### 3. `filter-notes-db-only.test.ts`

Tests database-specific operations:

-   ✅ Database connectivity verification
-   ✅ Data consistency checks
-   ✅ Performance testing
-   ✅ Concurrent operations

#### 4. `filter-notes-with-setup.test.ts`

Tests with automatic database setup:

-   ✅ Automatic test database reset and seeding
-   ✅ Data structure validation
-   ✅ Comprehensive filter testing with real data

## Running Tests

### Prerequisites

1. **Docker**: PostgreSQL container must be running
2. **Test Database**: Must be created and accessible
3. **Dependencies**: All Jest dependencies installed

### Basic Test Execution

```bash
# Run all tests
yarn test

# Run specific test file
npx jest tests/agent_tools/filter-notes.test.ts

# Run with verbose output
npx jest --verbose

# Run with specific timeout
npx jest --testTimeout=30000
```

### Test Database Setup

Before running tests that require data:

```bash
# Setup test database with sample data
yarn test:reset
```

## Test Database Utilities

### Database Helper Functions (`tests/utils/db-helpers.ts`)

```typescript
// Truncate all tables in test database
await truncateTestDatabase();

// Seed test database with sample data
await seedTestDatabase();

// Reset (truncate + seed) test database
await resetTestDatabase();
```

### Manual Database Commands

```bash
# Reset test database
POSTGRES_DB=hathi_db_test tsx db/migrate-runner.ts reset

# Seed test database
POSTGRES_DB=hathi_db_test tsx db/seed/seed-notes.ts

# Check test database data
POSTGRES_DB=hathi_db_test tsx db/inspect.ts overview
```

## Test Output and Debugging

### Typical Test Output

```
PASS  tests/agent_tools/filter-notes.test.ts
  Filter Notes Functions
    getFilterOptions
      ✓ should retrieve available filter options (43 ms)
    filterNotes
      ✓ should filter notes with basic limit (21 ms)
      ✓ should filter notes by note type (11 ms)
      ✓ should filter notes by context (10 ms)
      ✓ should filter notes by date range (15 ms)

Test Suites: 1 passed, 1 total
Tests: 5 passed, 5 total
```

### Debug Information

Tests include console.log output showing:

-   Filter options retrieved (contexts, hashtags, note types, statuses)
-   Query results (note counts, applied filters)
-   Performance metrics
-   Data structure validation

## Dependencies

### Core Testing Dependencies

```json
{
    "jest": "^30.0.5",
    "jest-environment-jsdom": "^30.0.5",
    "@testing-library/react": "^16.3.0",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.8.0",
    "@types/jest": "^30.0.0",
    "ts-node": "^10.9.2"
}
```

### Integration with Project

-   **TypeScript**: Full TypeScript support with proper type checking
-   **Drizzle ORM**: Tests work with existing database connection utilities
-   **Environment Variables**: Proper test environment isolation
-   **Next.js**: Compatible with Next.js project structure

## Best Practices

### Test Writing Guidelines

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use beforeAll/afterAll for database setup/teardown
3. **Assertions**: Use descriptive expect statements
4. **Logging**: Include console.log for debugging test data
5. **Timeouts**: Set appropriate timeouts for database operations

### Database Testing

1. **Test Data**: Use the dedicated test database (`hathi_db_test`)
2. **Seeding**: Ensure consistent test data using the seeding scripts
3. **Cleanup**: Reset database state between test runs
4. **Isolation**: Never test against production data

### Error Handling

1. **Database Errors**: Proper error handling for connection issues
2. **Timeouts**: Reasonable timeouts for database operations
3. **Fallbacks**: Graceful handling of missing test data
4. **Logging**: Clear error messages for debugging

## Troubleshooting

### Common Issues

#### 1. "TextEncoder is not defined"

-   **Cause**: Jest running in jsdom environment instead of node
-   **Solution**: Ensure `testEnvironment: 'node'` in jest.config.ts

#### 2. "ts-node is required"

-   **Cause**: Missing ts-node dependency for TypeScript config
-   **Solution**: `yarn add -D ts-node`

#### 3. Empty test results (no data found)

-   **Cause**: Test database not seeded
-   **Solution**: Run `yarn test:reset` before testing

#### 4. Database connection errors

-   **Cause**: Docker not running or incorrect credentials
-   **Solution**: Verify Docker is running and environment variables are correct

### Debug Commands

```bash
# Check Jest configuration
npx jest --showConfig

# List all test files
npx jest --listTests

# Run tests with maximum verbosity
npx jest --verbose --detectOpenHandles

# Check environment variables
node -e "console.log(process.env)" | grep POSTGRES
```

## Integration with CI/CD

For automated testing in CI/CD pipelines:

```bash
# Setup test database
docker-compose up -d postgres
yarn db:test:reset

# Run tests with coverage
yarn test:coverage

# Cleanup
docker-compose down
```

## Next Steps

1. **Additional Test Suites**: Add tests for other agent tools
2. **Integration Tests**: Test complete workflows
3. **Performance Tests**: Benchmark database operations
4. **Mock Testing**: Add tests with mocked external dependencies
5. **Snapshot Testing**: Add snapshot tests for UI components
