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
import { aiService } from "../../../lib/ai";
import { getCurrentEmbeddingConfig } from "../../../lib/ai";
import { dateToSlug } from "../../../lib/utils";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Define types for better type safety
interface SeedNote {
    content: string;
    contexts: string[];
    tags: string[];
    note_type: string;
    suggested_contexts: string[];
    status: string | null;
    deadline: string | null;
}

interface NoteToInsert {
    id: string;
    content: string;
    key_context: string;
    contextNames: string[];
    tags: string[];
    note_type: string;
    suggested_contexts: string[];
    created_at: Date;
    updated_at: Date;
    status: string | null;
    deadline: number | null;
}

// Load entrepreneur notes from seed data
const seedDataPath = path.join(__dirname, "../../seed-data/em-notes.json");

const emNotes = JSON.parse(fs.readFileSync(seedDataPath, "utf8"));

// Transform the data to match our expected format
const sampleNotes: SeedNote[] = emNotes.map((note: any) => ({
    content: note.content,
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
    if (!aiService) {
        throw new Error("AI provider not available - missing API key");
    }

    try {
        const response = await aiService.generateDocumentEmbedding({
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
    if (!aiService) {
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
        const response = await aiService.generateBatchDocumentEmbeddings(
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
 * Get past days (excluding today) - enough to accommodate all notes
 */
function getPastDays(noteCount: number, maxNotesPerDay: number): Date[] {
    const dates: Date[] = [];
    const now = new Date();

    // Calculate how many days we need to accommodate all notes
    const daysNeeded = Math.ceil(noteCount / maxNotesPerDay);

    // Start from yesterday and go back the required number of days
    for (let i = 1; i <= daysNeeded; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        dates.push(date);
    }

    return dates.reverse(); // Return in chronological order (oldest first)
}

/**
 * Generate random time for a given date (business hours: 8 AM - 8 PM)
 */
function getRandomTimeForDate(date: Date): Date {
    const newDate = new Date(date);
    const hour = Math.floor(Math.random() * 12) + 8; // 8 AM to 7 PM
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);

    newDate.setHours(hour, minute, second, 0);
    return newDate;
}

/**
 * Seeds the SQLite database with sample data and embeddings
 */
async function seedSqliteDatabase() {
    try {
        console.log("🌱 Seeding SQLite database...");

        const db = createSqliteDb();
        console.log(`📚 Loaded ${sampleNotes.length} seed notes`);

        // Use notes in their original order
        const notesToProcess = sampleNotes;
        const maxNotesPerDay = 10; // Allow up to 10 notes per day

        // Get enough past days to accommodate all notes
        const pastDays = getPastDays(notesToProcess.length, maxNotesPerDay);
        console.log(
            `📅 Distributing notes across past ${pastDays.length} days:`
        );
        pastDays.forEach((date: Date, index: number) => {
            console.log(
                `  Day ${index + 1}: ${dateToSlug(
                    date
                )} (${date.toDateString()})`
            );
        });

        // Distribute notes across the calculated days
        const notesToInsert: NoteToInsert[] = [];

        const notesDataForEmbeddings: Array<{
            id: string;
            content: string;
            contexts?: string[];
            tags?: string[];
            note_type?: string;
        }> = [];

        let noteIndex = 0;
        for (const date of pastDays) {
            const daySlug = dateToSlug(date);
            const notesForThisDay = Math.min(
                maxNotesPerDay,
                notesToProcess.length - noteIndex
            );

            console.log(`📝 Creating ${notesForThisDay} notes for ${daySlug}`);

            for (
                let i = 0;
                i < notesForThisDay && noteIndex < notesToProcess.length;
                i++
            ) {
                const seedNote = notesToProcess[noteIndex];
                const noteTimestamp = getRandomTimeForDate(date);
                const noteId = uuidv4();

                // Add date context to existing contexts
                const allContexts = [daySlug, ...seedNote.contexts];

                notesToInsert.push({
                    id: noteId,
                    content: seedNote.content,
                    key_context: daySlug,
                    contextNames: allContexts,
                    tags: seedNote.tags,
                    note_type: seedNote.note_type,
                    suggested_contexts: seedNote.suggested_contexts,
                    created_at: noteTimestamp,
                    updated_at: noteTimestamp,
                    status: seedNote.status,
                    deadline: seedNote.deadline
                        ? new Date(seedNote.deadline).getTime()
                        : null,
                });

                // Collect note data for embedding generation
                notesDataForEmbeddings.push({
                    id: noteId,
                    content: seedNote.content,
                    contexts: allContexts,
                    tags: seedNote.tags,
                    note_type: seedNote.note_type,
                });

                noteIndex++;
            }

            if (noteIndex >= notesToProcess.length) {
                break;
            }
        }

        console.log(`📝 Prepared ${notesToInsert.length} notes for insertion`);

        // Insert all notes
        for (const noteToInsert of notesToInsert) {
            await db.insert(notes).values({
                id: noteToInsert.id,
                content: noteToInsert.content,
                key_context: noteToInsert.key_context,
                tags: JSON.stringify(noteToInsert.tags),
                note_type: noteToInsert.note_type,
                suggested_contexts:
                    noteToInsert.suggested_contexts?.length > 0
                        ? JSON.stringify(noteToInsert.suggested_contexts)
                        : null,
                status: noteToInsert.status || null,
                deadline: noteToInsert.deadline,
                created_at: noteToInsert.created_at.getTime(),
                updated_at: noteToInsert.updated_at.getTime(),
            });
        }

        console.log(`✅ Successfully inserted ${notesToInsert.length} notes`);

        // Create contexts and note-context relationships
        console.log("🔗 Creating contexts and relationships...");
        const createdContexts = new Set<string>();

        for (const noteToInsert of notesToInsert) {
            for (const contextName of noteToInsert.contextNames) {
                // Create context if not already created
                if (!createdContexts.has(contextName)) {
                    try {
                        // Check if context exists
                        const existingContext = await db
                            .select()
                            .from(contexts)
                            .where(eq(contexts.name, contextName))
                            .limit(1);

                        if (existingContext.length === 0) {
                            const contextId = uuidv4();
                            await db.insert(contexts).values({
                                id: contextId,
                                name: contextName,
                            });
                            console.log(`  ✅ Created context: ${contextName}`);
                        }
                        createdContexts.add(contextName);
                    } catch (error) {
                        console.error(
                            `  ❌ Error creating context ${contextName}:`,
                            error
                        );
                    }
                }

                // Create note-context relationship
                try {
                    const contextRecord = await db
                        .select()
                        .from(contexts)
                        .where(eq(contexts.name, contextName))
                        .limit(1);

                    if (contextRecord.length > 0) {
                        await db.insert(notesContexts).values({
                            note_id: noteToInsert.id,
                            context_id: contextRecord[0].id,
                        });
                    }
                } catch (error) {
                    console.error(
                        `  ❌ Error linking note ${noteToInsert.id} to context ${contextName}:`,
                        error
                    );
                }
            }
        }

        console.log(`✅ Created contexts and note-context relationships`);

        // Generate and store embeddings if AI provider is available
        if (aiService && notesDataForEmbeddings.length > 0) {
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

        // Log summary
        console.log("📊 Seeding Summary:");
        console.log(`  - Total notes created: ${notesToInsert.length}`);
        console.log(
            `  - Date range: ${dateToSlug(pastDays[0])} to ${dateToSlug(
                pastDays[pastDays.length - 1]
            )}`
        );
        console.log(
            `  - Distribution: ~${Math.ceil(
                notesToInsert.length / 5
            )} notes per day`
        );

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
