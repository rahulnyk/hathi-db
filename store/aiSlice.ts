import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { suggestContexts, generateEmbedding } from "@/app/actions/ai";
import { patchNote } from "@/app/actions/notes";
import { Note, updateNoteWithSuggestedContexts } from "@/store/notesSlice";

// Types for AI-generated data
export interface SuggestedContexts {
    suggestions: string[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error?: string;
}

interface AIState {
    suggestedContexts: {
        [noteId: string]: SuggestedContexts;
    };
}

const initialState: AIState = {
    suggestedContexts: {},
};

// Async thunk for generating context suggestions
export const generateSuggestedContexts = createAsyncThunk(
    "ai/generateSuggestedContexts",
    async (
        {
            noteId,
            content,
            userId,
        }: {
            noteId: string;
            content: string;
            userId: string;
        },
        { rejectWithValue, dispatch }
    ) => {

        // Clear any existing suggestions for this note
        dispatch(clearSuggestedContexts(noteId));

        try {
            const suggestions = await suggestContexts({
                noteId,
                content,
            });

            // Dispatch action to update the note in Redux store immediately
            dispatch(updateNoteWithSuggestedContexts({ noteId, suggestions }));

            // Update the note optimistically in the database
            await patchNote({
                noteId,
                patches: {
                    suggested_contexts: suggestions,
                },
                userId,
            });

            return { noteId, suggestions };
        } catch (error: any) {
            return rejectWithValue({
                noteId,
                error: error?.message || "Failed to generate context suggestions",
            });
        }
    }
);

// Async thunk for generating embeddings
export const generateEmbeddingThunk = createAsyncThunk(
    "ai/generateEmbedding",
    async (
        {
            noteId,
            content,
            userId,
        }: {
            noteId: string;
            content: string;
            userId: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const embedding = await generateEmbedding({
                content,
            });

            // Update the note directly in the database without triggering frontend updates
            // since embeddings are not used in the UI
            await patchNote({
                noteId,
                patches: {
                    embedding: embedding,
                    embedding_model: "text-embedding-3-small",
                    embedding_created_at: new Date().toISOString(),
                },
                userId,
            });

            return { noteId, embedding };
        } catch (error: any) {
            return rejectWithValue({
                noteId,
                error: error?.message || "Failed to generate embedding",
            });
        }
    }
);

const aiSlice = createSlice({
    name: "ai",
    initialState,
    reducers: {
        clearSuggestedContexts: (state, action: PayloadAction<string>) => {
            const noteId = action.payload;
            delete state.suggestedContexts[noteId];
        },
        clearAllAI: (state) => {
            state.suggestedContexts = {};
        },
    },
    extraReducers: (builder) => {
        builder
            // Context Suggestions
            .addCase(generateSuggestedContexts.pending, (state, action) => {
                const noteId = action.meta.arg.noteId;
                state.suggestedContexts[noteId] = {
                    suggestions: [],
                    status: "loading",
                };
            })
            .addCase(generateSuggestedContexts.fulfilled, (state, action) => {
                const { noteId, suggestions } = action.payload;
                state.suggestedContexts[noteId] = {
                    suggestions,
                    status: "succeeded",
                };
            })
            .addCase(generateSuggestedContexts.rejected, (state, action) => {
                const { noteId, error } = action.payload as { noteId: string; error: string };
                state.suggestedContexts[noteId] = {
                    suggestions: [],
                    status: "failed",
                    error,
                };
            });
            // Note: Embedding cases removed since embeddings are handled directly in database
    },
});

export const { clearSuggestedContexts, clearAllAI } = aiSlice.actions;
export default aiSlice.reducer;
