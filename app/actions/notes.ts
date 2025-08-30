"use server";

import { databaseAdapter } from "@/db/adapter";
import { measureExecutionTime } from "@/lib/performance";
import type {
    Note,
    CreateNoteParams,
    UpdateNoteParams,
    FetchNotesParams,
} from "@/db/adapter/types";

/**
 * Adds a new note to the database.
 *
 * @param params - Parameters for creating a new note
 * @returns Promise that resolves to the created Note object
 */
export async function addNote(params: CreateNoteParams): Promise<Note> {
    return measureExecutionTime("addNote", async () => {
        try {
            return await databaseAdapter.createNote(params);
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
        try {
            return await databaseAdapter.deleteNote(noteId);
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
 * @param params - The fetch configuration object
 * @returns Promise that resolves with filtered notes array
 */
export async function fetchNotes(params: FetchNotesParams): Promise<Note[]> {
    return measureExecutionTime("fetchNotes", async () => {
        try {
            return await databaseAdapter.fetchNotes(params);
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
            return await databaseAdapter.fetchNotesByIds(noteIds);
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
    patches: UpdateNoteParams;
}): Promise<Note> {
    return measureExecutionTime("patchNote", async () => {
        try {
            return await databaseAdapter.updateNote(noteId, patches);
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
