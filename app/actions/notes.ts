"use server";

import { createClient } from "@/db/connection";
import { drizzle } from "drizzle-orm/node-postgres";
import { notes } from "@/db/schema";
import { type Note, NoteType } from "@/store/notesSlice";
import { measureExecutionTime } from "@/lib/performance";
import { TodoStatus } from "@/store/notesSlice";
import { eq, desc, and, inArray, arrayContains } from "drizzle-orm";

/**
 * Converts a database note record to the application Note type
 */
function convertDbNoteToNote(dbNote: Record<string, unknown>): Note {
    return {
        id: dbNote.id as string,
        content: dbNote.content as string,
        key_context: dbNote.key_context as string,
        contexts: dbNote.contexts as string[],
        tags: dbNote.tags as string[],
        suggested_contexts: dbNote.suggested_contexts
            ? (dbNote.suggested_contexts as string[])
            : undefined,
        note_type: dbNote.note_type as NoteType,
        embedding: dbNote.embedding
            ? (dbNote.embedding as number[])
            : undefined,
        embedding_model: dbNote.embedding_model
            ? (dbNote.embedding_model as string)
            : undefined,
        embedding_created_at: dbNote.embedding_created_at
            ? (dbNote.embedding_created_at as Date).toISOString()
            : undefined,
        deadline: dbNote.deadline
            ? (dbNote.deadline as Date).toISOString()
            : null,
        status: dbNote.status ? (dbNote.status as TodoStatus) : null,
        created_at: (dbNote.created_at as Date).toISOString(),
        persistenceStatus: "persisted" as const,
    };
}
/**
 * Adds a new note to the database.
 *
 * @param content - The content of the note
 * @param key_context - The primary context for the note
 * @param contexts - Optional array of additional contexts
 * @param tags - Optional array of tags for the note
 * @param note_type - Type of the note (default is "note")
 * @returns Promise that resolves to the created Note object
 */
export async function addNote({
    id,
    content,
    key_context,
    contexts,
    tags,
    note_type = "note",
    deadline,
    status,
}: {
    id: string; // UUID provided by the application
    content: string;
    key_context: string;
    contexts?: string[];
    tags?: string[];
    note_type?: NoteType;
    deadline?: string | null;
    status?: TodoStatus | null; // Using TodoStatus enum for type safety, stored as string in DB
}): Promise<Note> {
    return measureExecutionTime("addNote", async () => {
        const client = createClient();

        try {
            await client.connect();
            const db = drizzle(client, { schema: { notes } });

            const noteToInsert = {
                id,
                content,
                key_context,
                contexts: contexts || [],
                tags: tags || [],
                note_type,
                deadline: deadline ? new Date(deadline) : null,
                status: status || null,
            };

            const result = await db
                .insert(notes)
                .values(noteToInsert)
                .returning();

            if (!result || result.length === 0) {
                throw new Error("No data returned after insert");
            }

            return convertDbNoteToNote(result[0]);
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error adding note:", errorMessage);
            throw new Error(`Failed to add note: ${errorMessage}`);
        } finally {
            await client.end();
        }
    });
}

/**
 * Deletes a note by its ID.
 *
 * @param noteId - The ID of the note to delete
 * @returns Promise that resolves to an object containing the deleted note ID
 * @throws Error if the deletion fails
 */
export async function deleteNote({
    noteId,
}: {
    noteId: string;
}): Promise<{ noteId: string }> {
    return measureExecutionTime("deleteNote", async () => {
        const client = createClient();

        try {
            await client.connect();
            const db = drizzle(client, { schema: { notes } });

            await db.delete(notes).where(eq(notes.id, noteId));

            return { noteId };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error deleting note:", errorMessage);
            throw new Error(`Failed to delete note: ${errorMessage}`);
        } finally {
            await client.end();
        }
    });
}

/**
 * Fetches notes with optional context filtering
 *
 * @param payload - The fetch configuration object
 * @param payload.keyContext - Single context to filter by (ignored if contexts array is provided)
 * @param payload.contexts - Array of contexts to filter by (takes precedence over keyContext)
 * @param payload.method - Filtering method when using contexts array
 * - 'AND': Notes must contain ALL contexts from the array
 * - 'OR': Notes must contain ANY context from the array (default)
 *
 * @returns Promise that resolves with filtered notes array
 */
export async function fetchNotes({
    keyContext,
    contexts,
    method,
}: {
    keyContext?: string;
    contexts?: string[];
    method?: "AND" | "OR";
}): Promise<Note[]> {
    return measureExecutionTime("fetchNotes", async () => {
        if (!keyContext && (!contexts || contexts.length === 0)) {
            throw new Error(
                "At least one filtering parameter (keyContext or contexts) must be provided"
            );
        }

        const client = createClient();

        try {
            await client.connect();
            const db = drizzle(client, { schema: { notes } });

            if (contexts && contexts.length > 0) {
                if (method === "AND") {
                    // Notes must contain ALL contexts from the array
                    const andConditions = contexts.map((context) =>
                        arrayContains(notes.contexts, [context])
                    );
                    const result = await db
                        .select()
                        .from(notes)
                        .where(and(...andConditions))
                        .orderBy(desc(notes.created_at));

                    return result.map(convertDbNoteToNote);
                } else {
                    // Notes must contain ANY context from the array (OR logic)
                    const result = await db
                        .select()
                        .from(notes)
                        .where(arrayContains(notes.contexts, contexts))
                        .orderBy(desc(notes.created_at));

                    return result.map(convertDbNoteToNote);
                }
            } else if (keyContext) {
                // Fallback to single keyContext filtering
                const result = await db
                    .select()
                    .from(notes)
                    .where(arrayContains(notes.contexts, [keyContext]))
                    .orderBy(desc(notes.created_at));

                return result.map(convertDbNoteToNote);
            }

            return [];
        } catch (error) {
            console.error("Error fetching notes:", error);
            throw error;
        } finally {
            await client.end();
        }
    });
}

/**
 * Fetches notes by their IDs for the authenticated user
 * Used by source notes list to fetch missing notes not in Redux state
 *
 * @param noteIds - Array of note IDs to fetch
 * @returns Promise that resolves to an array of notes
 */
export async function fetchNotesByIds(noteIds: string[]): Promise<Note[]> {
    return measureExecutionTime("fetchNotesByIds", async () => {
        try {
            if (!noteIds || noteIds.length === 0) {
                return [];
            }

            const client = createClient();

            try {
                await client.connect();
                const db = drizzle(client, { schema: { notes } });

                // Fetch notes by IDs
                const result = await db
                    .select()
                    .from(notes)
                    .where(inArray(notes.id, noteIds));

                return result.map(convertDbNoteToNote);
            } finally {
                await client.end();
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Could not fetch notes by IDs.";
            console.error("Error in fetchNotesByIds:", errorMessage);
            throw new Error(errorMessage);
        }
    });
}

/**
 * Patches a note with the provided updates
 *
 * @param noteId - The ID of the note to update
 * @param patches - Partial note object with fields to update
 * @returns Promise that resolves to the updated note
 */
export async function patchNote({
    noteId,
    patches,
}: {
    noteId: string;
    patches: Partial<
        Pick<
            Note,
            | "content"
            | "contexts"
            | "tags"
            | "suggested_contexts"
            | "note_type"
            | "deadline"
            | "status"
        >
    > & {
        embedding?: number[];
        embedding_model?: string;
        embedding_created_at?: string;
    };
}): Promise<Note> {
    return measureExecutionTime("patchNote", async () => {
        const client = createClient();

        try {
            await client.connect();
            const db = drizzle(client, { schema: { notes } });

            // Prepare the update object
            const updateData: Record<string, unknown> = {};

            // Only include fields that are actually being updated
            Object.entries(patches).forEach(([key, value]) => {
                if (value !== undefined) {
                    if (key === "deadline" && typeof value === "string") {
                        updateData[key] = new Date(value);
                    } else if (
                        key === "embedding_created_at" &&
                        typeof value === "string"
                    ) {
                        updateData[key] = new Date(value);
                    } else {
                        updateData[key] = value;
                    }
                }
            });

            // Update the note
            const result = await db
                .update(notes)
                .set(updateData)
                .where(eq(notes.id, noteId))
                .returning();

            if (!result || result.length === 0) {
                throw new Error("No data returned after update");
            }

            return convertDbNoteToNote(result[0]);
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error patching note:", errorMessage);
            throw new Error(`Failed to patch note: ${errorMessage}`);
        } finally {
            await client.end();
        }
    });
}
