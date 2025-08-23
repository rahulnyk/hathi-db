#!/usr/bin/env tsx

import { createClient } from "./connection";

/**
 * Truncate all tables (keep schema, remove data)
 */
async function truncateTables() {
    console.log("🗑️  Truncating all tables...");

    const client = createClient();

    try {
        await client.connect();
        console.log("📦 Connected to PostgreSQL database");

        // Truncate all tables (RESTART IDENTITY resets auto-increment sequences)
        await client.query(`
            TRUNCATE TABLE notes RESTART IDENTITY CASCADE;
        `);

        console.log("✅ All tables truncated successfully");
    } catch (error) {
        console.error("❌ Truncate failed:", error);
        throw error;
    } finally {
        await client.end();
    }
}

/**
 * Main execution function
 */
async function main() {
    const command = process.argv[2];

    switch (command) {
        case "truncate":
            await truncateTables();
            break;
        default:
            console.log(`
Usage: tsx db/truncate.ts <command>

Commands:
  truncate       Remove all data from tables (keep schema)
            `);
            process.exit(1);
    }
}

// Run the script
main().catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
});
