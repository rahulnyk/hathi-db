import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// import { createClient } from "@/lib/supabase/client"; // Removed direct client import
// import { v4 as uuidv4 } from "uuid";
import { dateToSlug } from "@/lib/utils";
import {
    fetchNotes as fetchNotesAction,
    addNote as addNoteAction,
    deleteNote as deleteNoteAction,
    patchNote as patchNoteAction,
} from "@/app/actions/notes"; // Import server actions
import { refreshContextsMetadata } from "@/store/notesMetadataSlice";

// Enhanced persistence status
export type PersistenceStatus = "pending" | "persisted" | "failed" | "deleting";

// Define possible note types
export type NoteType = "note" | "todo" | null;

export type Note = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    persistenceStatus: PersistenceStatus;
    errorMessage?: string;
    key_context?: string;
    contexts?: string[];
    tags?: string[];
    note_type?: NoteType;
    suggested_contexts?: string[];
    embedding?: number[];
    embedding_model?: string;
    embedding_created_at?: string;
    isEditing?: boolean;
    originalContent?: string;
};

interface NotesState {
    notes: Note[];
    collectionStatus: "idle" | "loading" | "succeeded" | "failed";
    collectionError: string | null;
    currentContext: string;
}

const initialState: NotesState = {
    notes: [],
    collectionStatus: "idle",
    collectionError: null,
    currentContext: dateToSlug(new Date()),
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
            return notes;
        } catch (error: any) {
            return rejectWithValue(error?.message || "Failed to fetch notes");
        }
    }
);

export const addNote = createAsyncThunk(
    "notes/addNote",
    async (
        {
            tempId,
            ...noteData
        }: {
            tempId: string;
            content: string;
            key_context: string;
            contexts?: string[];
            tags?: string[];
            note_type?: NoteType;
        },
        { rejectWithValue, dispatch }
    ) => {
        try {
            const newNote = await addNoteAction({
                ...noteData,
            });

            // Refresh context metadata since new contexts might have been created
            dispatch(refreshContextsMetadata());

            return { tempId, note: newNote };
        } catch (error: any) {
            return rejectWithValue({
                error: error?.message || "Failed to add note",
                tempId,
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
            state.currentContext = action.payload;
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
        enterEditMode: (
            state,
            action: PayloadAction<{ noteId: string; originalContent: string }>
        ) => {
            const { noteId, originalContent } = action.payload;
            const noteIndex = state.notes.findIndex(
                (note) => note.id === noteId
            );
            if (noteIndex !== -1) {
                state.notes[noteIndex].isEditing = true;
                state.notes[noteIndex].originalContent = originalContent;
            }
        },
        exitEditMode: (
            state,
            action: PayloadAction<{ noteId: string; resetContent?: boolean }>
        ) => {
            const { noteId, resetContent = false } = action.payload;
            const noteIndex = state.notes.findIndex(
                (note) => note.id === noteId
            );
            if (noteIndex !== -1) {
                state.notes[noteIndex].isEditing = false;
                if (resetContent && state.notes[noteIndex].originalContent) {
                    state.notes[noteIndex].content = state.notes[noteIndex].originalContent;
                }
                state.notes[noteIndex].originalContent = undefined;
            }
        },
        updateEditingContent: (
            state,
            action: PayloadAction<{ noteId: string; content: string }>
        ) => {
            const { noteId, content } = action.payload;
            const noteIndex = state.notes.findIndex(
                (note) => note.id === noteId
            );
            if (noteIndex !== -1 && state.notes[noteIndex].isEditing) {
                state.notes[noteIndex].content = content;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotes.pending, (state) => {
                state.collectionStatus = "loading";
            })
            .addCase(
                fetchNotes.fulfilled,
                (state, action: PayloadAction<Note[]>) => {
                    state.collectionStatus = "succeeded";
                    state.notes = action.payload; // Payload is now directly the array of notes
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
                const { tempId, note } = action.payload;
                const noteIndex = state.notes.findIndex((n) => n.id === tempId);
                if (noteIndex !== -1) {
                    // Replace optimistic note with the real one from server
                    state.notes[noteIndex] = {
                        ...note, // note from server action already has persistenceStatus: "persisted"
                        // id is now the real id from the database
                    };
                }
            })
            .addCase(addNote.rejected, (state, action: any) => {
                const { tempId, error } = action.payload;
                const noteIndex = state.notes.findIndex(
                    (note) => note.id === tempId
                );
                if (noteIndex !== -1) {
                    state.notes[noteIndex].persistenceStatus = "failed";
                    state.notes[noteIndex].errorMessage = error;
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
    enterEditMode,
    exitEditMode,
    updateEditingContent,
} = notesSlice.actions;

export default notesSlice.reducer;
