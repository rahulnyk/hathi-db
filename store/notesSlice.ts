import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// import { createClient } from "@/lib/supabase/client"; // Removed direct client import
import { dateToSlug } from "@/lib/utils";
import {
    fetchNotes as fetchNotesAction,
    addNote as addNoteAction,
    deleteNote as deleteNoteAction,
    patchNote as patchNoteAction,
} from "@/app/actions/notes"; // Import server actions
import { extractDeadlineFromContent } from "@/app/actions/ai"; // Import AI action for deadline
import { refreshContextsMetadata } from "@/store/notesMetadataSlice";
import { setActiveNoteId } from "./uiSlice"; // Import setActiveNoteId

// Import types from database adapter
import type { Note as DbNote, NoteType, PersistenceStatus } from "@/db/types";

import { TodoStatus } from "@/db/types";

// Re-export TodoStatus for components to use
export { TodoStatus };

// Extended Note type for Redux state with additional UI properties
export type Note = DbNote & {
    isSearchResult?: boolean; // Flag for notes from agent search results
    errorMessage?: string;
};

interface NotesState {
    notes: Note[];
    collectionStatus: "idle" | "loading" | "succeeded" | "failed";
    collectionError: string | null;
    currentContext: string;
    notesContext: string | null; // Track which context the loaded notes belong to
}

const initialState: NotesState = {
    notes: [],
    collectionStatus: "idle",
    collectionError: null,
    currentContext: dateToSlug(new Date()),
    notesContext: null, // Initially no notes are loaded
};

/**
 * Async thunks for API calls using server actions
 */

/**
 * Fetches notes for a specific user with the given contexts.
 * @param contexts - Non-empty array of context strings to filter notes by
 * @throws Will reject with an error message if contexts is empty or if the fetch fails
 * @returns Array of Note objects that match the contexts
 */
export const fetchNotes = createAsyncThunk(
    "notes/fetchNotes",
    async (
        {
            contexts,
        }: {
            contexts: [string, ...string[]]; // Non-empty array type
        },
        { rejectWithValue }
    ) => {
        try {
            // Additional runtime check to ensure contexts is not empty
            if (contexts.length === 0) {
                return rejectWithValue("Context array cannot be empty");
            }

            const notes = await fetchNotesAction({
                contexts,
                method: "OR",
            });

            // Return both notes and the primary context they were fetched for
            return {
                notes,
                // We use the first context as the "primary" context for tracking which context the notes were fetched for,
                // because the UI typically requests notes for a single context at a time, and the first element represents that.
                primaryContext: contexts[0],
            };
        } catch (error: any) {
            return rejectWithValue(error?.message || "Failed to fetch notes");
        }
    }
);

export const addNote = createAsyncThunk(
    "notes/addNote",
    async (
        {
            id,
            ...noteData
        }: {
            id: string; // Required - UUID must be provided by the calling code
            content: string;
            key_context: string;
            contexts?: string[];
            tags?: string[];
            note_type?: NoteType;
        },
        { rejectWithValue, dispatch }
    ) => {
        // Use the provided UUID - no fallback generation
        const noteId = id;

        try {
            const finalNoteType = noteData.note_type || "note";
            let deadline: string | null = null;
            let status: TodoStatus | null = null;

            if (finalNoteType === "todo") {
                status = TodoStatus.TODO;
                try {
                    const extractedDeadline = await extractDeadlineFromContent({
                        content: noteData.content,
                    });
                    if (extractedDeadline) {
                        deadline = extractedDeadline;
                    }
                } catch (e) {
                    console.warn(
                        "AI deadline extraction failed or not yet implemented:",
                        e
                    );
                }
            }

            const notePayload: Parameters<typeof addNoteAction>[0] = {
                id: noteId, // Use provided ID or generated UUID
                ...noteData,
                note_type: finalNoteType,
            };

            if (finalNoteType === "todo") {
                notePayload.deadline = deadline;
                notePayload.status = status;
            }

            const newNote = await addNoteAction(notePayload);

            // Refresh context metadata since new contexts might have been created
            dispatch(refreshContextsMetadata());

            // Set the new note as active
            if (newNote && newNote.id) {
                dispatch(setActiveNoteId(newNote.id));
            }

            return newNote;
        } catch (error: any) {
            return rejectWithValue({
                error: error?.message || "Failed to add note",
                noteId, // Include the noteId for error handling
            });
        }
    }
);

export const deleteNote = createAsyncThunk(
    "notes/deleteNote",
    async ({ noteId }: { noteId: string }, { rejectWithValue, dispatch }) => {
        try {
            // Call the server action
            const result = await deleteNoteAction({ noteId });

            // Refresh context metadata since deleting a note might affect context statistics
            dispatch(refreshContextsMetadata());

            // Server action returns { noteId } on success
            return result; // This will be { noteId: string }
        } catch (error: any) {
            return rejectWithValue({
                error: error?.message || "Failed to delete note",
                noteId, // Pass noteId back for error handling in reducer
            });
        }
    }
);

export const patchNote = createAsyncThunk(
    "notes/patchNote",
    async (
        {
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
                    | "embedding"
                    | "embedding_model"
                    | "embedding_created_at"
                    | "deadline"
                    | "status"
                >
            >;
        },
        { rejectWithValue, dispatch }
    ) => {
        try {
            const updatedNote = await patchNoteAction({
                noteId,
                patches,
            });

            // Refresh context metadata since contexts might have been modified
            dispatch(refreshContextsMetadata());

            return updatedNote;
        } catch (error: any) {
            return rejectWithValue({
                error: error?.message || "Failed to patch note",
                noteId,
            });
        }
    }
);

const notesSlice = createSlice({
    name: "notes",
    initialState,
    reducers: {
        clearNotes: (state) => {
            state.notes = [];
        },
        addNoteOptimistically: (state, action: PayloadAction<Note>) => {
            state.notes.unshift(action.payload);
        },
        updateNotePersistenceStatus: (
            state,
            action: PayloadAction<{
                id: string;
                status: PersistenceStatus;
                errorMessage?: string;
            }>
        ) => {
            const { id, status, errorMessage } = action.payload;
            const noteIndex = state.notes.findIndex((note) => note.id === id);
            if (noteIndex !== -1) {
                state.notes[noteIndex].persistenceStatus = status;
                if (errorMessage) {
                    state.notes[noteIndex].errorMessage = errorMessage;
                } else {
                    delete state.notes[noteIndex].errorMessage;
                }
            }
        },
        markNoteAsDeleting: (state, action: PayloadAction<string>) => {
            const noteId = action.payload;
            const noteIndex = state.notes.findIndex(
                (note) => note.id === noteId
            );
            if (noteIndex !== -1) {
                state.notes[noteIndex].persistenceStatus = "deleting";
            }
        },
        setCurrentContext: (state, action: PayloadAction<string>) => {
            const newContext = action.payload;
            // Only clear notesContext if we're actually changing to a different context
            if (state.currentContext !== newContext) {
                state.currentContext = newContext;
                state.notesContext = null; // Clear since notes will no longer match
            }
            // If it's the same context, do nothing - keep existing notes and context
        },
        updateNoteWithSuggestedContexts: (
            state,
            action: PayloadAction<{ noteId: string; suggestions: string[] }>
        ) => {
            const { noteId, suggestions } = action.payload;
            const noteIndex = state.notes.findIndex(
                (note) => note.id === noteId
            );
            if (noteIndex !== -1) {
                state.notes[noteIndex].suggested_contexts = suggestions;
            }
        },
        updateNoteContent: (
            state,
            action: PayloadAction<{ noteId: string; content: string }>
        ) => {
            const { noteId, content } = action.payload;
            const noteIndex = state.notes.findIndex(
                (note) => note.id === noteId
            );
            if (noteIndex !== -1) {
                state.notes[noteIndex].content = content;
            }
        },
        // New action for optimistic note editing
        updateNoteOptimistically: (
            state,
            action: PayloadAction<{
                noteId: string;
                patches: Partial<
                    Pick<
                        Note,
                        "content" | "contexts" | "tags" | "deadline" | "status"
                    >
                >;
            }>
        ) => {
            const { noteId, patches } = action.payload;
            const noteIndex = state.notes.findIndex(
                (note) => note.id === noteId
            );
            if (noteIndex !== -1) {
                state.notes[noteIndex] = {
                    ...state.notes[noteIndex],
                    ...patches,
                    persistenceStatus: "pending",
                };
            }
        },
        // Action for creating notes optimistically with UUIDs
        createNoteOptimistically: (
            state,
            action: PayloadAction<{
                note: Note;
                autoSave: boolean;
            }>
        ) => {
            const { note } = action.payload;
            state.notes.unshift(note);
        },
        // Add search result notes to the store
        addSearchResultNotes: (state, action: PayloadAction<Note[]>) => {
            const searchResultNotes = action.payload.map((note) => ({
                ...note,
                isSearchResult: true,
                persistenceStatus: "persisted" as PersistenceStatus,
            }));

            // Remove any existing search result notes first
            state.notes = state.notes.filter((note) => !note.isSearchResult);

            // Add new search result notes to the beginning
            state.notes.unshift(...searchResultNotes);
        },
        // Remove search result notes (useful when leaving chat)
        clearSearchResultNotes: (
            state,
            action: PayloadAction<string[] | undefined>
        ) => {
            if (action.payload) {
                // Remove specific search result notes by ID
                state.notes = state.notes.filter(
                    (note) =>
                        !note.isSearchResult ||
                        !action.payload!.includes(note.id)
                );
            } else {
                // Remove all search result notes
                state.notes = state.notes.filter(
                    (note) => !note.isSearchResult
                );
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotes.pending, (state, action) => {
                state.collectionStatus = "loading";
                // Only clear notesContext if we're fetching for a different context
                const requestedContext =
                    action.meta?.arg?.contexts &&
                    action.meta.arg.contexts.length > 0
                        ? action.meta.arg.contexts[0]
                        : null;
                if (
                    requestedContext &&
                    state.notesContext !== requestedContext
                ) {
                    state.notesContext = null;
                }
            })
            .addCase(
                fetchNotes.fulfilled,
                (
                    state,
                    action: PayloadAction<{
                        notes: Note[];
                        primaryContext: string;
                    }>
                ) => {
                    state.collectionStatus = "succeeded";
                    state.notesContext = action.payload.primaryContext;
                    // Set persistenceStatus to "persisted" for all fetched notes since they exist in the database
                    // Only set it if it's not already defined (to handle cases where server might return it)
                    state.notes = action.payload.notes.map((note) => ({
                        ...note,
                        persistenceStatus:
                            note.persistenceStatus ||
                            ("persisted" as PersistenceStatus),
                    }));
                }
            )
            .addCase(fetchNotes.rejected, (state, action) => {
                state.collectionStatus = "failed";
                state.collectionError = action.payload as string;
            })
            .addCase(addNote.pending, (state) => {
                // Optimistic update already handled by addNoteOptimistically
            })
            .addCase(addNote.fulfilled, (state, action) => {
                const newNote = action.payload;
                // Since we're using actual UUIDs, the note should already exist from createNoteOptimistically
                const noteIndex = state.notes.findIndex(
                    (n) => n.id === newNote.id
                );
                if (noteIndex !== -1) {
                    // Replace optimistic note with the real one from server
                    state.notes[noteIndex] = {
                        ...newNote,
                        persistenceStatus: "persisted",
                    };
                } else {
                    // This should never happen with UUID approach - log error
                    console.error(
                        "addNote.fulfilled: Could not find optimistic note with ID:",
                        newNote.id,
                        "This indicates a bug in the note creation flow."
                    );
                    // As a fallback, add the note to prevent data loss
                    state.notes.unshift({
                        ...newNote,
                        persistenceStatus: "persisted",
                    });
                }
            })
            .addCase(addNote.rejected, (state, action: any) => {
                const { noteId, error } = action.payload;
                // Find and update the specific note that failed
                const noteIndex = state.notes.findIndex(
                    (note) => note.id === noteId
                );
                if (noteIndex !== -1) {
                    state.notes[noteIndex].persistenceStatus = "failed";
                    state.notes[noteIndex].errorMessage = error;
                } else {
                    // Fallback: just log if note not found
                    console.error("Failed to add note:", error);
                }
            })
            .addCase(deleteNote.pending, (state) => {
                // Optimistic update handled by markNoteAsDeleting
            })
            .addCase(deleteNote.fulfilled, (state, action) => {
                const { noteId } = action.payload; // payload is { noteId: string }
                state.notes = state.notes.filter((note) => note.id !== noteId);
            })
            .addCase(deleteNote.rejected, (state, action: any) => {
                const { noteId, error } = action.payload;
                const noteIndex = state.notes.findIndex(
                    (note) => note.id === noteId
                );
                if (noteIndex !== -1) {
                    // Revert status from "deleting" to "persisted" or "failed"
                    // Assuming "persisted" is the state before deletion was attempted
                    state.notes[noteIndex].persistenceStatus = "persisted";
                    state.notes[noteIndex].errorMessage = error;
                }
            })
            .addCase(patchNote.fulfilled, (state, action) => {
                const updatedNote = action.payload;
                const noteIndex = state.notes.findIndex(
                    (note) => note.id === updatedNote.id
                );
                if (noteIndex !== -1) {
                    // Update the note with the new data from server
                    state.notes[noteIndex] = {
                        ...state.notes[noteIndex],
                        ...updatedNote,
                        persistenceStatus: "persisted",
                    };
                }
            })
            .addCase(patchNote.rejected, (state, action: any) => {
                const { noteId, error } = action.payload;
                const noteIndex = state.notes.findIndex(
                    (note) => note.id === noteId
                );
                if (noteIndex !== -1) {
                    state.notes[noteIndex].persistenceStatus = "failed";
                    state.notes[noteIndex].errorMessage = error;
                }
            });
    },
});

export const {
    clearNotes,
    addNoteOptimistically,
    updateNotePersistenceStatus,
    markNoteAsDeleting,
    setCurrentContext,
    updateNoteWithSuggestedContexts,
    updateNoteContent,
    updateNoteOptimistically,
    createNoteOptimistically,
    addSearchResultNotes,
    clearSearchResultNotes,
} = notesSlice.actions;

// Selectors
export const selectNotesMatchCurrentContext = (state: {
    notes: NotesState;
}) => {
    return state.notes.notesContext === state.notes.currentContext;
};

export const selectIsLoadingForCurrentContext = (state: {
    notes: NotesState;
}) => {
    const { collectionStatus, notesContext, currentContext } = state.notes;

    // Show loading only when we're actually loading AND either:
    // 1. We haven't loaded any context yet (notesContext is null), OR
    // 2. We're loading a different context than what we currently have
    return (
        collectionStatus === "loading" &&
        (notesContext === null || notesContext !== currentContext)
    );
};

export default notesSlice.reducer;
