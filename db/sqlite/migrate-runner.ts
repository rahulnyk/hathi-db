/**
 * SQLite Migration Runner
 *
 * Handles running SQLite migrations and database setup for the embedded SQLite backend.
 */

import {
    runMigrations,
    createSqliteDb,
    getRawSqliteConnection,
} from "./connection";
import fs from "fs";
import path from "path";

/**
 * Run SQLite migrations
 */
async function migrate() {
    try {
        console.log("🚀 Running SQLite migrations...");
        runMigrations();
        console.log("✅ SQLite migrations completed successfully");
    } catch (error) {
        console.error("❌ SQLite migration failed:", error);
        process.exit(1);
    }
}

/**
 * Reset SQLite database (drop and recreate)
 */
async function reset() {
    try {
        console.log("🗑️  Resetting SQLite database...");

        // Delete the database file
        const dbPath = path.join(process.cwd(), "data", "hathi.db");
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log("✅ Database file deleted");
        }

        // Run migrations to recreate
        await migrate();

        console.log("✅ SQLite database reset completed");
    } catch (error) {
        console.error("❌ SQLite reset failed:", error);
        process.exit(1);
    }
}

/**
 * Test SQLite connection
 */
async function test() {
    try {
        console.log("🔌 Testing SQLite connection...");

        const db = createSqliteDb();
        const rawDb = getRawSqliteConnection();

        // Test basic query
        const result = rawDb.prepare("SELECT 1 as test").get();
        console.log("✅ SQLite connection test passed:", result);

        console.log("✅ SQLite connection test completed");
    } catch (error) {
        console.error("❌ SQLite connection test failed:", error);
        process.exit(1);
    }
}

/**
 * Truncate all SQLite tables
 */
async function truncate() {
    try {
        console.log("🧹 Truncating SQLite tables...");

        const rawDb = getRawSqliteConnection();

        // Delete data from tables in correct order (respecting foreign keys)
        rawDb.prepare("DELETE FROM notes_contexts").run();
        rawDb.prepare("DELETE FROM notes").run();
        rawDb.prepare("DELETE FROM contexts").run();

        // Clear vector table if it exists
        try {
            rawDb.prepare("DELETE FROM vec0").run();
        } catch (error) {
            console.warn("Vector table might not exist:", error);
        }

        console.log("✅ SQLite tables truncated");
    } catch (error) {
        console.error("❌ SQLite truncate failed:", error);
        process.exit(1);
    }
}

/**
 * Main CLI handler
 */
async function main() {
    const command = process.argv[2];

    switch (command) {
        case "migrate":
            await migrate();
            break;
        case "reset":
            await reset();
            break;
        case "test":
            await test();
            break;
        case "truncate":
            await truncate();
            break;
        default:
            console.log("Available commands:");
            console.log("  migrate   - Run SQLite migrations");
            console.log("  reset     - Reset SQLite database");
            console.log("  test      - Test SQLite connection");
            console.log("  truncate  - Truncate all SQLite tables");
            break;
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

export { migrate, reset, test, truncate };
