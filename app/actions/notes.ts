"use server";

import { createClient } from "@/lib/supabase/server";
import { type Note, NoteType } from "@/store/notesSlice";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { measureExecutionTime } from "@/lib/performance";

/**
 * Retrieves the currently authenticated user from Supabase.
 *
 * @param client - The Supabase client instance
 * @returns Promise that resolves to the authenticated user object
 * @throws Error if no user is authenticated
 */
async function getAuthUser(client: SupabaseClient): Promise<User> {
    const {
        data: { user },
        error,
    } = await client.auth.getUser();

    if (!user) {
        const errorMessage =
            error?.message || "No user authenticated. Please log in.";
        console.error("Authentication error:", errorMessage);
        throw new Error(errorMessage);
    }

    return user;
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
    content,
    key_context,
    contexts,
    tags,
    note_type = "note",
}: {
    content: string;
    key_context: string;
    contexts?: string[];
    tags?: string[];
    note_type?: NoteType;
}): Promise<Note> {
    return measureExecutionTime("addNote", async () => {
        const supabase = await createClient();
        const user = await getAuthUser(supabase);

        try {
            const noteToInsert = {
                content,
                user_id: user.id,
                key_context,
                contexts: contexts || [],
                tags: tags || [],
                note_type,
            };
            const { data, error } = await supabase
                .from("notes")
                .insert([noteToInsert])
                .select();

            if (error) throw error;
            if (!data || data.length === 0)
                throw new Error("No data returned after insert");

            return {
                ...data[0],
                persistenceStatus: "persisted",
            } as Note;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error adding note:", errorMessage);
            throw new Error(`Failed to add note: ${errorMessage}`);
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
        const supabase = await createClient();
        const user = await getAuthUser(supabase);

        try {
            const { error } = await supabase
                .from("notes")
                .delete()
                .eq("id", noteId)
                .eq("user_id", user.id);

            if (error) throw error;

            return { noteId };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error deleting note:", errorMessage);
            throw new Error(`Failed to delete note: ${errorMessage}`);
        }
    });
}

/**
 * Fetches notes with optional context filtering
 *
 * @param userId - The user ID to fetch notes for
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
        const supabase = await createClient();
        const user = await getAuthUser(supabase);
        try {
            // Start query with user filtering using the provided userId

            let query = supabase
                .from("notes")
                .select("*")
                .eq("user_id", user.id) // Filter by provided user ID
                .order("created_at", { ascending: false });

            if (contexts && contexts.length > 0) {
                query = applyContextsArrayFilter(
                    query,
                    contexts,
                    method || "OR"
                );
            } else if (keyContext) {
                // Fallback to single keyContext filtering (existing functionality)
                query = query.contains("contexts", [keyContext]);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Supabase error:", error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error("Error fetching notes:", error);
            throw error;
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

            const client = await createClient();
            const user = await getAuthUser(client);

            // Fetch notes by IDs for the current user
            const { data: notes, error: fetchError } = await client
                .from("notes")
                .select("*")
                .in("id", noteIds)
                .eq("user_id", user.id);

            if (fetchError) {
                console.error("Error fetching notes by IDs:", fetchError);
                throw new Error(`Failed to fetch notes: ${fetchError.message}`);
            }

            return (notes as Note[]) || [];
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
 * @param userId - The user ID for authorization
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
            "content" | "contexts" | "tags" | "suggested_contexts" | "note_type"
        >
    > & {
        embedding?: number[];
        embedding_model?: string;
        embedding_created_at?: string;
    };
}): Promise<Note> {
    return measureExecutionTime("patchNote", async () => {
        const supabase = await createClient();
        const user = await getAuthUser(supabase);

        try {
            // Prepare the update object
            const updateData: Record<string, unknown> = {};

            // Only include fields that are actually being updated
            Object.entries(patches).forEach(([key, value]) => {
                if (value !== undefined) {
                    updateData[key] = value;
                }
            });

            // Update the note
            const { data, error } = await supabase
                .from("notes")
                .update(updateData)
                .eq("id", noteId)
                .eq("user_id", user.id)
                .select()
                .single();

            if (error) throw error;
            if (!data) throw new Error("No data returned after update");

            return {
                ...data,
                persistenceStatus: "persisted",
            } as Note;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error patching note:", errorMessage);
            throw new Error(`Failed to patch note: ${errorMessage}`);
        }
    });
}

/**
 * Applies context array filtering to Supabase query
 *
 * @param query - Supabase query builder instance
 * @param contexts - Array of contexts to filter by
 * @param method - Filtering method ('AND' or 'OR')
 * @returns Modified query with context filtering applied
 */
function applyContextsArrayFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any, // Supabase query builder type
    contexts: string[],
    method: "AND" | "OR"
) {
    if (method === "AND") {
        // Notes must contain ALL contexts from the array
        // Apply each context as a separate contains filter (AND logic)
        contexts.forEach((context) => {
            query = query.contains("contexts", [context]);
        });
    } else {
        // Notes must contain ANY context from the array (OR logic)
        query = query.contains("contexts", contexts);
    }

    return query;
}

/**
 * Represents the statistics for a single context.
 */
export interface ContextStat {
    context: string;
    count: number;
    lastUsed: string; // ISO 8601 timestamp string
}

/**
 * Fetches statistics for all distinct contexts for the currently authenticated user.
 * This includes the occurrence count and the most recent usage timestamp for each context.
 *
 * This action relies on the `get_user_context_stats` PostgreSQL function, which must be
 * created in the Supabase database for this to work.
 *
 * @returns A promise that resolves to an array of ContextStat objects,
 *          sorted by count and then by last used date in descending order.
 */
export async function fetchContextStats(): Promise<ContextStat[]> {
    const supabase = await createClient();
    const user = await getAuthUser(supabase);

    try {
        // Call the database function `get_user_context_stats` with the user's ID.
        // The function performs all the complex aggregation on the database side.
        const { data, error } = await supabase.rpc("get_user_context_stats", {
            p_user_id: user.id,
        });

        if (error) {
            console.error("Supabase RPC error fetching context stats:", error);
            throw error;
        }

        // The RPC call returns data in the exact shape of the ContextStat interface.
        return data || [];
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Could not fetch context statistics.";
        console.error("Error in fetchContextStats:", errorMessage);
        throw new Error(errorMessage);
    }
}
