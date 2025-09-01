#!/usr/bin/env node

const { createSqliteDb } = require("@/db/sqlite/connection");

async function verifySeeding() {
    console.log("🔍 Verifying SQLite database seeding...\n");

    try {
        const db = createSqliteDb();

        // Count total notes
        const notesCount = await db
            .select()
            .from(db.select().from(require("./db/sqlite/schema").notes));
        console.log(`📝 Total notes in database: ${notesCount.length}`);

        // Count contexts
        const contextsResult = await db
            .select()
            .from(require("./db/sqlite/schema").contexts);
        console.log(`🏷️  Total contexts: ${contextsResult.length}`);

        // Show some sample contexts
        console.log("\n📋 Sample contexts:");
        contextsResult.slice(0, 10).forEach((context) => {
            console.log(`   - ${context.name}`);
        });

        // Show first few notes
        console.log("\n📖 Sample notes:");
        notesCount.slice(0, 3).forEach((note, index) => {
            console.log(
                `\n${index + 1}. [${note.note_type}] ${note.key_context}`
            );
            console.log(`   ${note.content.substring(0, 100)}...`);
            if (note.tags) {
                const tags = JSON.parse(note.tags);
                console.log(`   Tags: ${tags.join(", ")}`);
            }
        });

        console.log("\n✅ Database verification completed!");
    } catch (error) {
        console.error("❌ Verification failed:", error);
    }
}

verifySeeding();
