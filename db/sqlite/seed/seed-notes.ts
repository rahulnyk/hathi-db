/**
 * SQLite Database Seeding
 *
 * Seeds the SQLite database with initial data for testing and development.
 * Includes embedding generation for semantic search functionality.
 */

import { createSqliteDb } from "../connection";
import { notes, contexts, notesContexts } from "../schema";
import { SqliteAdapter } from "../sqlite";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { GeminiAI } from "../../../lib/ai/gemini";
import { getCurrentEmbeddingConfig } from "../../../lib/ai/ai-config";

// Load environment variables
dotenv.config({ path: ".env.local" });

const googleApiKey = process.env.GOOGLE_AI_API_KEY;

if (!googleApiKey) {
    console.error("❌ Missing GOOGLE_AI_API_KEY environment variable");
    console.log("💡 Seeding will continue without embeddings");
}

const aiProvider = googleApiKey ? new GeminiAI(googleApiKey) : null;

// Load entrepreneur notes from seed data
const seedDataPath = path.join(
    __dirname,
    "../../seed-data/entrepreneur-notes.json"
);
const entrepreneurNotes = JSON.parse(fs.readFileSync(seedDataPath, "utf8"));

// Transform the data to match our expected format
const sampleNotes = entrepreneurNotes.map((note: any) => ({
    content: note.content,
    key_context: note.contexts?.[0] || "general", // Use first context as key_context
    contexts: note.contexts || [],
    tags: note.tags || [],
    note_type: note.note_type || "note",
    suggested_contexts: note.suggested_contexts || [],
    status: note.status || null,
    deadline: note.deadline || null,
}));

/**
 * Generate document embedding using AI provider
 */
async function generateDocumentEmbedding(
    content: string,
    contexts?: string[],
    tags?: string[],
    noteType?: string
): Promise<number[]> {
    if (!aiProvider) {
        throw new Error("AI provider not available - missing API key");
    }

    try {
        const response = await aiProvider.generateDocumentEmbedding({
            content,
            contexts,
            tags,
            noteType,
        });
        return response.embedding;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
}

/**
 * Generate embeddings for multiple notes in batch
 */
async function generateBatchEmbeddings(
    notesData: Array<{
        id: string;
        content: string;
        contexts?: string[];
        tags?: string[];
        note_type?: string;
    }>
): Promise<Array<{ id: string; embedding: number[] }>> {
    if (!aiProvider) {
        console.log(
            "⚠️  Skipping embedding generation - no AI provider available"
        );
        return [];
    }

    try {
        console.log(
            `🧠 Generating embeddings for ${notesData.length} notes in batch...`
        );

        // Prepare batch request
        const batchRequest = {
            documents: notesData.map((note) => ({
                content: note.content,
                contexts: note.contexts || undefined,
                tags: note.tags || undefined,
                noteType: note.note_type || undefined,
            })),
        };

        // Generate batch embeddings
        const response = await aiProvider.generateBatchDocumentEmbeddings(
            batchRequest
        );

        // Map embeddings back to note IDs
        const embeddingsWithIds = notesData.map((note, index) => ({
            id: note.id,
            embedding: response.embeddings[index],
        }));

        console.log(
            `✅ Successfully generated ${embeddingsWithIds.length} embeddings in batch`
        );
        return embeddingsWithIds;
    } catch (error) {
        console.error("Error generating batch embeddings:", error);
        throw error;
    }
}

/**
 * Update notes with embeddings using SQLite adapter
 */
async function updateNotesWithEmbeddings(
    embeddingsData: Array<{ id: string; embedding: number[] }>
): Promise<void> {
    if (embeddingsData.length === 0) {
        console.log("⚠️  No embeddings to update");
        return;
    }

    console.log(
        `💾 Updating ${embeddingsData.length} notes with embeddings...`
    );

    const sqliteAdapter = new SqliteAdapter();
    const embeddingModel = getCurrentEmbeddingConfig().model;

    for (const embeddingData of embeddingsData) {
        try {
            await sqliteAdapter.upsertEmbedding(
                embeddingData.id,
                embeddingData.embedding,
                embeddingModel
            );
            console.log(
                `    ✅ Updated note ${embeddingData.id} with embedding`
            );
        } catch (error) {
            console.error(
                `    ❌ Error updating note ${embeddingData.id}:`,
                error
            );
            // Continue with next note instead of failing the entire batch
        }
    }

    console.log(`✅ Completed updating all notes with embeddings`);
}

/**
 * Seeds the SQLite database with sample data and embeddings
 */
async function seedSqliteDatabase() {
    try {
        console.log("🌱 Seeding SQLite database...");

        const db = createSqliteDb();
        const notesDataForEmbeddings: Array<{
            id: string;
            content: string;
            contexts?: string[];
            tags?: string[];
            note_type?: string;
        }> = [];

        // Insert sample notes
        for (const noteData of sampleNotes) {
            const noteId = uuidv4();

            // Insert note
            await db.insert(notes).values({
                id: noteId,
                content: noteData.content,
                key_context: noteData.key_context,
                tags: JSON.stringify(noteData.tags),
                note_type: noteData.note_type,
                suggested_contexts:
                    noteData.suggested_contexts?.length > 0
                        ? JSON.stringify(noteData.suggested_contexts)
                        : null,
                status: noteData.status || null,
                deadline: noteData.deadline
                    ? new Date(noteData.deadline).getTime()
                    : null,
            });

            // Collect note data for embedding generation
            notesDataForEmbeddings.push({
                id: noteId,
                content: noteData.content,
                contexts: noteData.contexts,
                tags: noteData.tags,
                note_type: noteData.note_type,
            });

            // Insert contexts and link them
            if (noteData.contexts && noteData.contexts.length > 0) {
                for (const contextName of noteData.contexts) {
                    // Check if context exists
                    const existingContext = await db
                        .select()
                        .from(contexts)
                        .where(eq(contexts.name, contextName))
                        .limit(1);

                    let contextId: string;
                    if (existingContext.length > 0) {
                        contextId = existingContext[0].id;
                    } else {
                        // Create new context
                        contextId = uuidv4();
                        await db.insert(contexts).values({
                            id: contextId,
                            name: contextName,
                        });
                    }

                    // Link note to context
                    await db.insert(notesContexts).values({
                        note_id: noteId,
                        context_id: contextId,
                    });
                }
            }
        }

        console.log(
            `✅ Successfully seeded ${sampleNotes.length} entrepreneur notes`
        );

        // Generate and store embeddings if AI provider is available
        if (aiProvider && notesDataForEmbeddings.length > 0) {
            try {
                console.log("🧠 Starting embedding generation process...");
                const embeddingsData = await generateBatchEmbeddings(
                    notesDataForEmbeddings
                );
                await updateNotesWithEmbeddings(embeddingsData);
                console.log("✅ Embedding generation completed successfully");
            } catch (error) {
                console.error("❌ Embedding generation failed:", error);
                console.log("⚠️  Notes were seeded but without embeddings");
            }
        } else {
            console.log(
                "⚠️  Skipping embedding generation - no AI provider available"
            );
        }

        console.log("🏁 SQLite database seeding completed");
    } catch (error) {
        console.error("❌ SQLite seeding failed:", error);
        throw error;
    }
}

/**
 * Main function for CLI usage
 */
async function main() {
    await seedSqliteDatabase();
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

export { seedSqliteDatabase };
