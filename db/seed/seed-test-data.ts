/**
 * Simple test data seeding script that doesn't require AI services
 * Inserts basic notes data for testing filter functionality
 */

import { v4 as uuidv4 } from "uuid";
import { createDb } from "../connection.js";
import { notes } from "../schema.js";

/**
 * Generate a random embedding vector for testing purposes
 * @param dimensions - Number of dimensions for the embedding (default: 1536 for OpenAI)
 * @returns Array of random numbers between -1 and 1
 */
function generateRandomEmbedding(dimensions: number = 1536): number[] {
    return Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
}

export async function seedTestData() {
    const db = createDb();
    const client = db.$client;

    console.log("🌱 Seeding test database with minimal data...");

    try {
        // Connect to the database
        await client.connect();
        console.log("📦 Connected to test database");

        // Simple test notes with random embeddings
        const testNotes = [
            {
                id: uuidv4(),
                content:
                    "Test note 1 - Project planning meeting #planning #important",
                key_context: "test-planning",
                contexts: ["test-planning", "meetings"],
                tags: ["planning", "important"],
                note_type: "note",
                embedding: generateRandomEmbedding(),
                embedding_model: "test-random-1536",
                embedding_created_at: new Date("2025-08-20T10:00:00Z"),
                created_at: new Date("2025-08-20T10:00:00Z"),
                updated_at: new Date("2025-08-20T10:00:00Z"),
            },
            {
                id: uuidv4(),
                content:
                    "Test note 2 - Development tasks and priorities #development #tasks",
                key_context: "development",
                contexts: ["development", "tasks"],
                tags: ["development", "tasks"],
                note_type: "note",
                embedding: generateRandomEmbedding(),
                embedding_model: "test-random-1536",
                embedding_created_at: new Date("2025-08-21T14:30:00Z"),
                created_at: new Date("2025-08-21T14:30:00Z"),
                updated_at: new Date("2025-08-21T14:30:00Z"),
            },
            {
                id: uuidv4(),
                content:
                    "Test note 3 - Marketing strategy review #marketing #strategy",
                key_context: "marketing",
                contexts: ["marketing", "strategy"],
                tags: ["marketing", "strategy"],
                note_type: "note",
                embedding: generateRandomEmbedding(),
                embedding_model: "test-random-1536",
                embedding_created_at: new Date("2025-08-22T09:15:00Z"),
                created_at: new Date("2025-08-22T09:15:00Z"),
                updated_at: new Date("2025-08-22T09:15:00Z"),
            },
            {
                id: uuidv4(),
                content:
                    "Test note 4 - Team feedback and retrospective #team #feedback",
                key_context: "team",
                contexts: ["team", "feedback"],
                tags: ["team", "feedback"],
                note_type: "note",
                embedding: generateRandomEmbedding(),
                embedding_model: "test-random-1536",
                embedding_created_at: new Date("2025-08-23T16:45:00Z"),
                created_at: new Date("2025-08-23T16:45:00Z"),
                updated_at: new Date("2025-08-23T16:45:00Z"),
            },
            {
                id: uuidv4(),
                content:
                    "Test note 5 - Product roadmap discussion #product #roadmap",
                key_context: "product",
                contexts: ["product", "roadmap"],
                tags: ["product", "roadmap"],
                note_type: "note",
                embedding: generateRandomEmbedding(),
                embedding_model: "test-random-1536",
                embedding_created_at: new Date("2025-08-23T11:00:00Z"),
                created_at: new Date("2025-08-23T11:00:00Z"),
                updated_at: new Date("2025-08-23T11:00:00Z"),
            },
        ];

        // Insert test notes
        const insertedNotes = await db
            .insert(notes)
            .values(testNotes)
            .returning();

        console.log(
            `✅ Successfully inserted ${insertedNotes.length} test notes`
        );
        console.log("📊 Test data summary:");
        console.log(`  - Total notes: ${insertedNotes.length}`);
        console.log(
            `  - Contexts: ${
                Array.from(new Set(testNotes.flatMap((n) => n.contexts))).length
            } unique`
        );
        console.log(
            `  - Tags: ${
                Array.from(new Set(testNotes.flatMap((n) => n.tags))).length
            } unique`
        );
        console.log(
            `  - Note types: ${
                Array.from(new Set(testNotes.map((n) => n.note_type))).length
            } unique`
        );
        console.log(
            `  - Embeddings: All notes have 1536-dimensional random embeddings`
        );

        // Verify data was inserted
        const count = await db.select().from(notes);
        console.log(`🔍 Verification: Found ${count.length} notes in database`);

        return insertedNotes;
    } catch (error) {
        console.error("❌ Failed to seed test data:", error);
        throw error;
    } finally {
        // Ensure database connection is closed
        await client.end();
    }
}

// Run if called directly
if (require.main === module) {
    seedTestData()
        .then(() => {
            console.log("🎉 Test data seeding completed successfully!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("💥 Test data seeding failed:", error);
            process.exit(1);
        });
}
