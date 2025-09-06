/**
 * Database Factory - Environment Switching
 *
 * This module creates the appropriate database adapter based on the USE_DB environment variable.
 * Allows switching between PostgreSQL and SQLite backends.
 */

import { PostgreSQLAdapter } from "./postgres/adapter/postgresql";
import { SqliteAdapter } from "./sqlite/sqlite";

// Load environment variables if not already loaded (for standalone scripts)
if (!process.env.NEXT_RUNTIME) {
    try {
        const dotenv = require("dotenv");
        dotenv.config({ path: ".env.local" });
    } catch (error) {
        // dotenv might not be available in all environments
    }
}

/**
 * Factory function to create the appropriate database adapter
 */
export function createDatabaseAdapter() {
    const useDb = process.env.USE_DB || "sqlite";

    if (useDb === "sqlite") {
        console.log("🔧 Using SQLite database");
        return new SqliteAdapter();
    } else {
        console.log("🔧 Using Sqlite database");
        return new PostgreSQLAdapter();
    }
}

// Export the singleton database adapter instance
export const db = createDatabaseAdapter();

// Export types for convenience
export type { DatabaseAdapter } from "./types";
export * from "./types";
