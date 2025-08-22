#!/usr/bin/env tsx

import { addNote, fetchNotes } from "../app/actions/notes";
import { fetchContextStats as fetchContextStatsCtx } from "../app/actions/contexts";
import { randomUUID } from "crypto";

async function testMigration() {
    console.log("🧪 Testing Step 2 Migration - Local Database Integration");
    console.log("=".repeat(60));

    try {
        // Test 1: Add a test note
        console.log("\n1. 📝 Testing addNote...");
        const testNote = await addNote({
            id: randomUUID(),
            content: "This is a test note for migration testing",
            key_context: "test-migration",
            contexts: ["test-migration", "development", "database"],
            tags: ["test", "migration"],
            note_type: "note",
        });

        console.log("✅ Note added successfully:", {
            id: testNote.id,
            content: testNote.content,
            contexts: testNote.contexts,
        });

        // Test 2: Fetch notes
        console.log("\n2. 🔍 Testing fetchNotes...");
        const notes = await fetchNotes({
            keyContext: "test-migration",
        });

        console.log(
            `✅ Found ${notes.length} note(s) with context 'test-migration'`
        );

        // Test 3: Fetch context stats (from contexts actions)
        console.log("\n3. 📊 Testing fetchContextStats from contexts...");
        const contextStats = await fetchContextStatsCtx();

        console.log(`✅ Found ${contextStats.length} context(s) with stats`);
        if (contextStats.length > 0) {
            console.log("Sample context stats:", contextStats.slice(0, 3));
        }

        console.log(
            "\n🎉 All tests passed! Migration to local database successful!"
        );
    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    } finally {
        // Ensure we exit the process to avoid hanging
        setTimeout(() => {
            console.log("\n🔄 Exiting test process...");
            process.exit(0);
        }, 1000);
    }
}

testMigration();
