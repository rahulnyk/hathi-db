// Load environment variables FIRST
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { v4 as uuidv4 } from "uuid";
import { getAiService, getEmbeddingService } from "@/lib/ai";
import { dateToSlug } from "@/lib/utils";
import { createClient } from "../connection";
import { notes, contexts, notesContexts } from "../schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import seedData from "@/db/seed-data/entrepreneur-notes.json";

const aiService = getAiService();
const embeddingService = getEmbeddingService();

interface SeedNote {
    content: string;
    contexts: string[];
    tags: string[];
    note_type: string;
    suggested_contexts: string[];
}

interface NoteToInsert {
    id: string;
    content: string;
    key_context: string;
    tags: string[];
    note_type: string;
    // Contexts suggested by the AI or seed data, not necessarily linked in the DB
    suggested_contexts: string[];
    created_at: Date;
    updated_at: Date;
    embedding?: number[];
    embedding_model?: string;
    embedding_created_at?: Date;
    // Context names to be linked in the DB (includes date context and explicit contexts)
    contextNames: string[];
}

// Function to generate embeddings for multiple notes in batch
async function generateBatchEmbeddings(
    notesData: Array<{
        id: string;
        content: string;
        contexts?: string[] | null;
        tags?: string[] | null;
        note_type?: string | null;
    }>
): Promise<Array<{ id: string; embedding: number[] }>> {
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
        const response = await embeddingService.generateBatchDocumentEmbeddings(
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

import { NodePgDatabase } from "drizzle-orm/node-postgres";

// Function to update notes with embeddings in the database
async function updateNotesWithEmbeddings(
    db: NodePgDatabase<{
        notes: typeof notes;
        contexts: typeof contexts;
        notesContexts: typeof notesContexts;
    }>,
    embeddingsData: Array<{ id: string; embedding: number[] }>
): Promise<void> {
    console.log(
        `💾 Updating ${embeddingsData.length} notes with embeddings...`
    );

    for (const embeddingData of embeddingsData) {
        try {
            await db
                .update(notes)
                .set({
                    embedding: embeddingData.embedding,
                    embedding_model:
                        embeddingService.getCurrentEmbeddingConfig().model,
                    embedding_created_at: new Date(),
                })
                .where(eq(notes.id, embeddingData.id));

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

// Function to upsert contexts and return their IDs
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

// Function to link notes to contexts
async function linkNotesToContexts(
    db: NodePgDatabase<{
        notes: typeof notes;
        contexts: typeof contexts;
        notesContexts: typeof notesContexts;
    }>,
    notesToInsert: NoteToInsert[]
): Promise<void> {
    console.log("🔗 Creating note-context relationships...");

    // Collect all unique context names
    const allContextNames = new Set<string>();
    notesToInsert.forEach((note) => {
        note.contextNames.forEach((contextName) =>
            allContextNames.add(contextName)
        );
    });

    console.log(`📋 Found ${allContextNames.size} unique contexts to upsert`);

    // Upsert all contexts
    const contextMap = await upsertContexts(db, Array.from(allContextNames));

    // Create junction table entries
    const junctionEntries = [];
    for (const note of notesToInsert) {
        for (const contextName of note.contextNames) {
            junctionEntries.push({
                note_id: note.id,
                context_id: contextMap[contextName],
            });
        }
    }

    if (junctionEntries.length > 0) {
        await db.insert(notesContexts).values(junctionEntries);
        console.log(
            `✅ Created ${junctionEntries.length} note-context relationships`
        );
    }
}

// Get past 7 days (excluding today)
function getPastSevenDays(): Date[] {
    const dates: Date[] = [];
    const now = new Date();

    // Start from yesterday and go back 7 days
    for (let i = 1; i <= 7; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        dates.push(date);
    }

    return dates.reverse(); // Return in chronological order (oldest first)
}

// Shuffle array to distribute notes randomly across days
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Generate random time for a given date (business hours: 8 AM - 8 PM)
function getRandomTimeForDate(date: Date): Date {
    const newDate = new Date(date);
    const hour = Math.floor(Math.random() * 12) + 8; // 8 AM to 7 PM
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);

    newDate.setHours(hour, minute, second, 0);
    return newDate;
}

async function runSeedNotes() {
    try {
        console.log("🌱 Starting note seeding process...");

        // Create database connection
        const client = createClient();
        await client.connect();
        const db = drizzle(client, {
            schema: { notes, contexts, notesContexts },
        });

        console.log(`📚 Loaded ${seedData.length} seed notes`);

        // Get past 7 days
        const pastDays = getPastSevenDays();
        console.log(`📅 Distributing notes across past 7 days:`);
        pastDays.forEach((date, index) => {
            console.log(
                `  Day ${index + 1}: ${dateToSlug(
                    date
                )} (${date.toDateString()})`
            );
        });

        // Shuffle notes to distribute randomly
        const shuffledNotes = shuffleArray(seedData);

        // Distribute notes across the 7 days (max 10 notes per day)
        const notesToInsert: NoteToInsert[] = [];
        const maxNotesPerDay = Math.min(
            10,
            Math.ceil(shuffledNotes.length / 7)
        );

        let noteIndex = 0;
        for (const date of pastDays) {
            const daySlug = dateToSlug(date);
            const notesForThisDay = Math.min(
                maxNotesPerDay,
                shuffledNotes.length - noteIndex
            );

            console.log(`📝 Creating ${notesForThisDay} notes for ${daySlug}`);

            for (
                let i = 0;
                i < notesForThisDay && noteIndex < shuffledNotes.length;
                i++
            ) {
                const seedNote = shuffledNotes[noteIndex];
                const noteTimestamp = getRandomTimeForDate(date);

                // Add date context to existing contexts
                const allContexts = [daySlug, ...seedNote.contexts];

                notesToInsert.push({
                    id: uuidv4(),
                    content: seedNote.content,
                    key_context: daySlug,
                    contextNames: allContexts,
                    tags: seedNote.tags,
                    note_type: seedNote.note_type,
                    suggested_contexts: seedNote.suggested_contexts,
                    created_at: noteTimestamp,
                    updated_at: noteTimestamp,
                });

                noteIndex++;
            }
        }

        console.log(`🎯 Prepared ${notesToInsert.length} notes for insertion`);

        // Insert notes into database (without contexts)
        console.log("💾 Inserting notes into database...");
        const notesForDb = notesToInsert.map((note) => ({
            id: note.id,
            content: note.content,
            key_context: note.key_context,
            tags: note.tags,
            note_type: note.note_type,
            suggested_contexts: note.suggested_contexts,
            created_at: note.created_at,
            updated_at: note.updated_at,
        }));

        const insertedNotes = await db
            .insert(notes)
            .values(notesForDb)
            .returning();

        console.log(`✅ Successfully inserted ${insertedNotes.length} notes!`);

        // Link notes to contexts via junction table
        await linkNotesToContexts(db, notesToInsert);

        // Generate embeddings for all notes in batch
        const embeddingsData = await generateBatchEmbeddings(insertedNotes);

        // Update notes with embeddings
        await updateNotesWithEmbeddings(db, embeddingsData);

        console.log("🎉 Seeding completed successfully!");
        console.log(`📊 Summary:`);
        console.log(`  - Total notes created: ${insertedNotes.length}`);
        console.log(
            `  - Date range: ${dateToSlug(pastDays[0])} to ${dateToSlug(
                pastDays[pastDays.length - 1]
            )}`
        );
        console.log(
            `  - Notes per day: ~${Math.ceil(insertedNotes.length / 7)}`
        );

        // Close database connection
        await client.end();
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

// Run the seed function
runSeedNotes().catch(console.error);
