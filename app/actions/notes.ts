"use server";

import { createClient } from "@/lib/supabase/server";
import { type Note, NoteType } from "@/store/notesSlice";

export async function addNote({
    content,
    userId,
    key_context,
    contexts,
    tags,
    note_type = "note",
}: {
    content: string;
    userId: string;
    key_context: string;
    contexts?: string[];
    tags?: string[];
    note_type?: NoteType;
}): Promise<Note> {
    const supabase = await createClient();
    try {
        const noteToInsert = {
            content,
            user_id: userId,
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
            error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error adding note:", errorMessage);
        throw new Error(`Failed to add note: ${errorMessage}`);
    }
}

export async function deleteNote({
    noteId,
    userId,
}: {
    noteId: string;
    userId: string;
}): Promise<{ noteId: string }> {
    const supabase = await createClient();
    try {
        const { error } = await supabase
            .from("notes")
            .delete()
            .eq("id", noteId)
            .eq("user_id", userId);

        if (error) throw error;

        return { noteId };
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error fetching notes:", errorMessage);
        throw new Error(`Failed to fetch notes: ${errorMessage}`);
    }
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
export async function fetchNotes(
    userId: string,
    payload?: {
        keyContext?: string;
        contexts?: string[];
        method?: "AND" | "OR";
    }
) {
    const supabase = await createClient();

    try {
        // Start query with user filtering using the provided userId
        let query = supabase
            .from("notes")
            .select("*")
            .eq("user_id", userId) // Filter by provided user ID
            .order("created_at", { ascending: false });

        // If no filtering parameters provided, return all notes for the user
        if (!payload) {
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        }

        const { keyContext, contexts, method = "OR" } = payload;

        // Context array filtering takes precedence over keyContext
        if (contexts && contexts.length > 0) {
            query = applyContextsArrayFilter(query, contexts, method);
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

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            console.warn(
                "User not authenticated. Returning empty context stats."
            );
            return [];
        }

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
        console.error("Error in fetchContextStats:", error);
        throw new Error("Could not fetch context statistics.");
    }
}
