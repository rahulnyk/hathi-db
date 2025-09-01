# Database Verification Tools

This directory contains utilities for verifying database state and functions during development and migration.

## Files

### `verify-clean-db.ts`

Checks that the database only contains the clean functions without legacy authentication parameters.

**Usage:**

```bash
tsx db/verifications/verify-clean-db.ts
```

**Purpose:**

-   Verifies no functions with `p_user_id` parameters exist
-   Lists all current application functions
-   Ensures database cleanup was successful after migration

### `check-functions.ts`

Inspects database functions for duplicate signatures and conflicts.

**Usage:**

```bash
tsx db/verifications/check-functions.ts
```

**Purpose:**

-   Lists function signatures for context-related functions
-   Helps identify function conflicts during migration
-   Useful for debugging PostgreSQL function ambiguity issues

## When to Use

These tools are primarily for:

-   **Migration verification** - Ensuring database state after migrations
-   **Development debugging** - Identifying function conflicts or issues
-   **Database maintenance** - Periodic checks of database consistency

## Note

These are development/maintenance tools and are not included in the production build.
