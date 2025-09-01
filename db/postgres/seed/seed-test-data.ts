/**
 * Simple test data seeding script that doesn't require AI services
 * Inserts basic notes data for testing filter functionality
 */

import { v4 as uuidv4 } from "uuid";
import { createDb } from "../connection.js";
import { notes, contexts, notesContexts } from "../schema.js";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";

/**
 * Generate a random embedding vector for testing purposes
 * @param dimensions - Number of dimensions for the embedding (default: 1536 for OpenAI)
 * @returns Array of random numbers between -1 and 1
 */
function generateRandomEmbedding(dimensions: number = 1536): number[] {
    return Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
}

// Helper function to upsert contexts and return their IDs
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

async function upsertContexts(
    db: NodePgDatabase<{
        notes: typeof notes;
        contexts: typeof contexts;
        notesContexts: typeof notesContexts;
    }>,
    contextNames: string[]
): Promise<{ [name: string]: string }> {
    const contextMap: { [name: string]: string } = {};

    for (const contextName of contextNames) {
        // Try to find existing context
        const existingContext = await db
            .select()
            .from(contexts)
            .where(eq(contexts.name, contextName))
            .limit(1);

        if (existingContext.length > 0) {
            contextMap[contextName] = existingContext[0].id;
        } else {
            // Create new context
            const newContextId = uuidv4();
            await db.insert(contexts).values({
                id: newContextId,
                name: contextName,
            });
            contextMap[contextName] = newContextId;
        }
    }

    return contextMap;
}

// Helper function to link notes to contexts
async function linkNotesToContexts(
    db: any,
    noteContextPairs: Array<{ noteId: string; contextNames: string[] }>
): Promise<void> {
    // Collect all unique context names
    const allContextNames = new Set<string>();
    noteContextPairs.forEach((pair) => {
        pair.contextNames.forEach((contextName) =>
            allContextNames.add(contextName)
        );
    });

    // Upsert all contexts
    const contextMap = await upsertContexts(db, Array.from(allContextNames));

    // Create junction table entries
    const junctionEntries = [];
    for (const pair of noteContextPairs) {
        for (const contextName of pair.contextNames) {
            junctionEntries.push({
                note_id: pair.noteId,
                context_id: contextMap[contextName],
            });
        }
    }

    if (junctionEntries.length > 0) {
        await db.insert(notesContexts).values(junctionEntries);
    }
}

export async function seedTestData() {
    const db = createDb();
    const client = db.$client;

    console.log("🌱 Seeding test database with minimal data...");

    try {
        // Connect to the database
        await client.connect();
        const drizzleDb = drizzle(client, {
            schema: { notes, contexts, notesContexts },
        });
        console.log("📦 Connected to test database");

        // Simple test notes with contexts stored separately
        const testNotesData = [
            {
                note: {
                    id: uuidv4(),
                    content:
                        "Test note 1 - Project planning meeting #planning #important",
                    key_context: "test-planning",
                    tags: ["planning", "important"],
                    note_type: "note",
                    embedding: generateRandomEmbedding(),
                    embedding_model: "test-random-1536",
                    embedding_created_at: new Date("2025-08-20T10:00:00Z"),
                    created_at: new Date("2025-08-20T10:00:00Z"),
                    updated_at: new Date("2025-08-20T10:00:00Z"),
                },
                contexts: ["test-planning", "meetings"],
            },
            {
                note: {
                    id: uuidv4(),
                    content:
                        "Test note 2 - Development tasks and priorities #development #tasks",
                    key_context: "development",
                    tags: ["development", "tasks"],
                    note_type: "note",
                    embedding: generateRandomEmbedding(),
                    embedding_model: "test-random-1536",
                    embedding_created_at: new Date("2025-08-21T14:30:00Z"),
                    created_at: new Date("2025-08-21T14:30:00Z"),
                    updated_at: new Date("2025-08-21T14:30:00Z"),
                },
                contexts: ["development", "tasks"],
            },
            {
                note: {
                    id: uuidv4(),
                    content:
                        "Test note 3 - Marketing strategy review #marketing #strategy",
                    key_context: "marketing",
                    tags: ["marketing", "strategy"],
                    note_type: "note",
                    embedding: generateRandomEmbedding(),
                    embedding_model: "test-random-1536",
                    embedding_created_at: new Date("2025-08-22T09:15:00Z"),
                    created_at: new Date("2025-08-22T09:15:00Z"),
                    updated_at: new Date("2025-08-22T09:15:00Z"),
                },
                contexts: ["marketing", "strategy"],
            },
            {
                note: {
                    id: uuidv4(),
                    content:
                        "Test note 4 - Team feedback and retrospective #team #feedback",
                    key_context: "team",
                    tags: ["team", "feedback"],
                    note_type: "note",
                    embedding: generateRandomEmbedding(),
                    embedding_model: "test-random-1536",
                    embedding_created_at: new Date("2025-08-23T16:45:00Z"),
                    created_at: new Date("2025-08-23T16:45:00Z"),
                    updated_at: new Date("2025-08-23T16:45:00Z"),
                },
                contexts: ["team", "feedback"],
            },
            {
                note: {
                    id: uuidv4(),
                    content:
                        "Test note 5 - Product roadmap discussion #product #roadmap",
                    key_context: "product",
                    tags: ["product", "roadmap"],
                    note_type: "note",
                    embedding: generateRandomEmbedding(),
                    embedding_model: "test-random-1536",
                    embedding_created_at: new Date("2025-08-23T11:00:00Z"),
                    created_at: new Date("2025-08-23T11:00:00Z"),
                    updated_at: new Date("2025-08-23T11:00:00Z"),
                },
                contexts: ["product", "roadmap"],
            },
        ];

        // Extract notes for insertion (without contexts)
        const testNotes = testNotesData.map((data) => data.note);

        // Insert test notes
        const insertedNotes = await drizzleDb
            .insert(notes)
            .values(testNotes)
            .returning();

        console.log(
            `✅ Successfully inserted ${insertedNotes.length} test notes`
        );

        // Link notes to contexts
        const noteContextPairs = testNotesData.map((data) => ({
            noteId: data.note.id,
            contextNames: data.contexts,
        }));

        await linkNotesToContexts(drizzleDb, noteContextPairs);
        console.log("✅ Successfully linked notes to contexts");

        console.log("📊 Test data summary:");
        console.log(`  - Total notes: ${insertedNotes.length}`);
        console.log(
            `  - Contexts: ${
                Array.from(new Set(testNotesData.flatMap((n) => n.contexts)))
                    .length
            } unique`
        );
        console.log(
            `  - Tags: ${
                Array.from(new Set(testNotesData.flatMap((n) => n.note.tags)))
                    .length
            } unique`
        );
        console.log(
            `  - Note types: ${
                Array.from(new Set(testNotesData.map((n) => n.note.note_type)))
                    .length
            } unique`
        );
        console.log(
            `  - Embeddings: All notes have 1536-dimensional random embeddings`
        );

        // Verify data was inserted
        const count = await drizzleDb.select().from(notes);
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
