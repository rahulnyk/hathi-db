#!/usr/bin/env tsx

import { createSqliteDb } from "@/db/sqlite/connection";
import { notes, contexts } from "@/db/sqlite/schema";

async function verifySeeding() {
    console.log("🔍 Verifying SQLite database seeding...\n");

    try {
        const db = createSqliteDb();

        // Count total notes
        const notesResult = await db.select().from(notes);
        console.log(`📝 Total notes in database: ${notesResult.length}`);

        // Count contexts
        const contextsResult = await db.select().from(contexts);
        console.log(`🏷️  Total contexts: ${contextsResult.length}`);

        // Show some sample contexts
        console.log("\n📋 Sample contexts:");
        contextsResult.slice(0, 10).forEach((context) => {
            console.log(`   - ${context.name}`);
        });

        // Show first few notes
        console.log("\n📖 Sample notes:");
        notesResult.slice(0, 3).forEach((note, index) => {
            console.log(
                `\n${index + 1}. [${note.note_type}] ${note.key_context}`
            );
            console.log(`   ${note.content.substring(0, 100)}...`);
            if (note.tags) {
                const tags = JSON.parse(note.tags);
                console.log(`   Tags: ${tags.join(", ")}`);
            }
            if (note.suggested_contexts) {
                const suggestedContexts = JSON.parse(note.suggested_contexts);
                console.log(`   Suggested: ${suggestedContexts.join(", ")}`);
            }
        });

        console.log("\n✅ Database verification completed!");
    } catch (error) {
        console.error("❌ Verification failed:", error);
    }
}

verifySeeding();
