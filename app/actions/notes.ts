"use server";

import { createClient } from "@/lib/supabase/server";
import { type Note, NoteType } from "@/store/notesSlice";

export async function fetchNotes({
    userId,
    keyContext,
}: {
    userId: string;
    keyContext?: string;
}): Promise<Note[]> {
    const supabase = await createClient();
    try {
        // Start building the query
        let query = supabase.from("notes").select("*").eq("user_id", userId);

        // Add key_context filter if provided
        if (keyContext) {
            query = query.eq("key_context", keyContext);
        }

        // Execute the query with ordering
        const { data, error } = await query.order("created_at", {
            ascending: false,
        });

        if (error) throw error;

        return data.map((note) => ({
            ...note,
            persistenceStatus: "persisted",
        })) as Note[];
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error fetching notes:", errorMessage);
        throw new Error(`Failed to fetch notes: ${errorMessage}`);
    }
}

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
