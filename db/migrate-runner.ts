#!/usr/bin/env tsx

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDb, createClient, testConnection } from "./connection";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

/**
 * Custom migration runner that handles SQL files in order
 * This ensures extensions, triggers, and functions are applied correctly
 */
async function runMigrations() {
    console.log("🚀 Starting database migration...");

    // Test connection first
    const connectionTest = await testConnection();
    if (!connectionTest) {
        console.error(
            "❌ Cannot connect to database. Please check your configuration."
        );
        process.exit(1);
    }

    const client = createClient();

    try {
        await client.connect();
        console.log("📦 Connected to PostgreSQL database");

        // Get all migration files in order
        const migrateDir = join(process.cwd(), "db", "migrate");
        const files = readdirSync(migrateDir)
            .filter((file) => file.endsWith(".sql"))
            .sort(); // This ensures files run in numerical order

        console.log(`📋 Found ${files.length} migration files:`);
        files.forEach((file) => console.log(`   - ${file}`));

        // Run each migration file in order
        for (const file of files) {
            console.log(`\n🔄 Executing migration: ${file}`);

            const filePath = join(migrateDir, file);
            const sql = readFileSync(filePath, "utf-8");

            try {
                // Split by statement-breakpoint and execute each statement
                const statements = sql
                    .split("--> statement-breakpoint")
                    .filter((stmt) => stmt.trim());

                for (const statement of statements) {
                    const cleanStatement = statement.trim();
                    if (cleanStatement) {
                        await client.query(cleanStatement);
                    }
                }

                console.log(`   ✅ ${file} completed successfully`);
            } catch (error) {
                console.error(`   ❌ Error in ${file}:`, error);
                throw error;
            }
        }

        console.log("\n🎉 All migrations completed successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

/**
 * Reset database (drop all tables and run migrations fresh)
 */
async function resetDatabase() {
    console.log("🔄 Resetting database...");

    const client = createClient();

    try {
        await client.connect();

        // Drop all tables
        console.log("🗑️ Dropping existing tables...");
        await client.query(`
      DROP TABLE IF EXISTS notes CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
      DROP FUNCTION IF EXISTS get_user_context_stats() CASCADE;
      DROP FUNCTION IF EXISTS get_user_context_stats_paginated(integer, integer, text) CASCADE;
      DROP FUNCTION IF EXISTS search_user_contexts(text, integer) CASCADE;
      DROP FUNCTION IF EXISTS search_notes_by_similarity(vector, float, integer) CASCADE;
    `);

        console.log("✅ Database reset completed");

        // Run migrations
        await runMigrations();
    } catch (error) {
        console.error("❌ Database reset failed:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

/**
 * Main function
 */
async function main() {
    const command = process.argv[2];

    switch (command) {
        case "up":
        case "migrate":
            await runMigrations();
            break;
        case "reset":
            await resetDatabase();
            break;
        case "test":
            await testConnection();
            break;
        default:
            console.log(`
Usage: tsx db/migrate-runner.ts <command>

Commands:
  up, migrate    Run all pending migrations
  reset          Drop all tables and run migrations fresh  
  test           Test database connection

Environment variables:
  POSTGRES_HOST      Database host (default: localhost)
  POSTGRES_PORT      Database port (default: 5432)
  POSTGRES_USER      Database user (default: postgres)
  POSTGRES_PASSWORD  Database password (default: hathi-db-1234%)
  POSTGRES_DB        Database name (default: postgres)
      `);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
