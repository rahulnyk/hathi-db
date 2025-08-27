import * as dotenv from "dotenv";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { GeminiAI } from "../../lib/ai/gemini";
import { getCurrentEmbeddingConfig } from "../../lib/ai/ai-config";
import { dateToSlug } from "../../lib/utils";
import { createClient } from "../connection";
import { notes } from "../schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

// Load environment variables
dotenv.config({ path: ".env.local" });

const googleApiKey = process.env.GOOGLE_AI_API_KEY!;

if (!googleApiKey) {
    console.error("Missing required environment variables: GOOGLE_AI_API_KEY");
    process.exit(1);
}

const aiProvider = new GeminiAI(googleApiKey);

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
    contexts: string[];
    tags: string[];
    note_type: string;
    suggested_contexts: string[];
    created_at: Date;
    updated_at: Date;
    embedding?: number[];
    embedding_model?: string;
    embedding_created_at?: Date;
}

// Function to generate document embedding using AI provider
async function generateDocumentEmbedding(
    content: string,
    contexts?: string[],
    tags?: string[],
    noteType?: string
): Promise<number[]> {
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

// Function to update notes with embeddings in the database
async function updateNotesWithEmbeddings(
    db: any,
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
                    embedding_model: getCurrentEmbeddingConfig().model,
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
        const db = drizzle(client);

        // Load seed data
        const seedFilePath = path.join(__dirname, "entrepreneur-notes.json");
        const seedData = JSON.parse(
            await fs.readFile(seedFilePath, "utf-8")
        ) as SeedNote[];

        console.log(
            `📚 Loaded ${seedData.length} seed notes from ${seedFilePath}`
        );

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
                    contexts: allContexts,
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

        // Insert notes into database
        console.log("💾 Inserting notes into database...");
        const insertedNotes = await db
            .insert(notes)
            .values(notesToInsert)
            .returning();

        console.log(`✅ Successfully inserted ${insertedNotes.length} notes!`);

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
