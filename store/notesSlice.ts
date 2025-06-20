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
 * @param userId - The user ID to fetch notes for
 * @param contexts - Non-empty array of context strings to filter notes by
 * @throws Will reject with an error message if contexts is empty or if the fetch fails
 * @returns Array of Note objects that match the contexts
 */
export const fetchNotes = createAsyncThunk(
    "notes/fetchNotes",
    async (
        {
            userId,
            contexts,
        }: {
            userId: string;
            contexts: [string, ...string[]]; // Non-empty array type
        },
        { rejectWithValue }
    ) => {
        try {
            // Additional runtime check to ensure contexts is not empty
            if (contexts.length === 0) {
                return rejectWithValue("Context array cannot be empty");
            }

            const notes = await fetchNotesAction(userId, {
                contexts,
                method: "OR",
            });
            return notes;
        } catch (error: any) {
            return rejectWithValue(error?.message || "Failed to fetch notes");
        }
    }
);
// export const fetchNotes = createAsyncThunk(
//     "notes/fetchNotes",
//     async (
//         { userId, contexts }: { userId: string; contexts: string[] },
//         { rejectWithValue }
//     ) => {
//         try {
//             const notes = await fetchNotesAction(userId, {
//                 contexts,
//                 method: "OR",
//             });
//             return notes;
//         } catch (error: any) {
//             return rejectWithValue(error?.message || "Failed to fetch notes");
//         }
//     }
// );

export const addNote = createAsyncThunk(
    "notes/addNote",
    async (
        {
            content,
            userId,
            tempId, // tempId is used for optimistic updates, not passed to server action directly
            key_context,
            contexts,
            tags,
            note_type = "note",
        }: {
            content: string;
            userId: string;
            tempId: string;
            key_context: string;
            contexts?: string[];
            tags?: string[];
            note_type?: NoteType;
        },
        { rejectWithValue }
    ) => {
        try {
            // Call the server action
            const newNote = await addNoteAction({
                content,
                userId,
                key_context,
                contexts,
                tags,
                note_type,
            });
            // The server action returns the persisted note with its actual ID
            return {
                tempId, // Return tempId to update the optimistic note
                note: newNote, // newNote already has persistenceStatus: "persisted"
            };
        } catch (error: any) {
            return rejectWithValue({
                error: error?.message || "Failed to add note",
                tempId, // Pass tempId back for error handling in reducer
            });
        }
    }
);

export const deleteNote = createAsyncThunk(
    "notes/deleteNote",
    async (
        { noteId, userId }: { noteId: string; userId: string },
        { rejectWithValue }
    ) => {
        try {
            // Call the server action
            const result = await deleteNoteAction({ noteId, userId });
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
            userId,
        }: {
            noteId: string;
            patches: Partial<Pick<Note, "content" | "contexts" | "tags" | "suggested_contexts" | "note_type">>;
            userId: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const updatedNote = await patchNoteAction({
                noteId,
                patches,
                userId,
            });
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
} = notesSlice.actions;

export default notesSlice.reducer;
