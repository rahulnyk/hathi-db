import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

// Enhanced persistence status
export type PersistenceStatus = "pending" | "persisted" | "failed";

export type Note = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    persistenceStatus: PersistenceStatus;
    errorMessage?: string; // Optional error message for failed persistence
};

interface NotesState {
    notes: Note[];
    collectionStatus: "idle" | "loading" | "succeeded" | "failed";
    collectionError: string | null;
}

const initialState: NotesState = {
    notes: [],
    collectionStatus: "idle",
    collectionError: null,
};

const supabase = createClient();

// Async thunks for API calls
export const fetchNotes = createAsyncThunk(
    "notes/fetchNotes",
    async (userId: string, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from("notes")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Mark all fetched notes as persisted
            return data.map((note) => ({
                ...note,
                persistenceStatus: "persisted" as PersistenceStatus,
            }));
        } catch (error: any) {
            return rejectWithValue(error?.message);
        }
    }
);

export const addNote = createAsyncThunk(
    "notes/addNote",
    async (
        {
            content,
            userId,
            tempId,
        }: { content: string; userId: string; tempId: string },
        { rejectWithValue }
    ) => {
        try {
            const { data, error } = await supabase
                .from("notes")
                .insert([{ content, user_id: userId }])
                .select();

            if (error) throw error;

            // Return both the temp ID and the real data
            return {
                tempId,
                note: {
                    ...data[0],
                    persistenceStatus: "persisted" as PersistenceStatus,
                },
            };
        } catch (error: any) {
            console.log(error);
            return rejectWithValue({
                error: error?.message,
                tempId,
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
        // Updated action to set the persistence status
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
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Handle fetchNotes - affects the entire collection
            .addCase(fetchNotes.pending, (state) => {
                state.collectionStatus = "loading";
            })
            .addCase(
                fetchNotes.fulfilled,
                (state, action: PayloadAction<Note[]>) => {
                    state.collectionStatus = "succeeded";
                    state.notes = action.payload;
                }
            )
            .addCase(fetchNotes.rejected, (state, action) => {
                state.collectionStatus = "failed";
                state.collectionError = action.payload as string;
            })

            // Handle addNote - only affects individual notes
            .addCase(addNote.pending, (state) => {
                // No global state change, individual note is already marked as pending
            })
            .addCase(addNote.fulfilled, (state, action) => {
                // No change to global state, just update the individual note
                const { tempId, note } = action.payload;
                const noteIndex = state.notes.findIndex((n) => n.id === tempId);

                if (noteIndex !== -1) {
                    state.notes[noteIndex] = note;
                }
            })
            .addCase(addNote.rejected, (state, action: any) => {
                // No change to global state, just update the individual note
                const tempId = action.payload.tempId;
                const noteIndex = state.notes.findIndex(
                    (note) => note.id === tempId
                );
                if (noteIndex !== -1) {
                    state.notes[noteIndex].persistenceStatus = "failed";
                    state.notes[noteIndex].errorMessage = action.payload.error;
                }
            });
    },
});

export const {
    clearNotes,
    addNoteOptimistically,
    updateNotePersistenceStatus,
} = notesSlice.actions;

export default notesSlice.reducer;

// Helper function to create an optimistic note
export const createOptimisticNote = (content: string, userId: string): Note => {
    const now = new Date().toISOString();
    return {
        id: uuidv4(), // Generate temporary ID
        content,
        created_at: now,
        user_id: userId,
        persistenceStatus: "pending", // Initially pending persistence
    };
};
