import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { suggestContexts } from "@/app/actions/ai";
import { Note } from "@/store/notesSlice";

// Types for AI-generated data
export interface SuggestedContexts {
    suggestions: string[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error?: string;
}

export interface Embedding {
    embedding: number[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error?: string;
}

interface AIState {
    suggestedContexts: {
        [noteId: string]: SuggestedContexts;
    };
    embeddings: {
        [noteId: string]: Embedding;
    };
}

const initialState: AIState = {
    suggestedContexts: {},
    embeddings: {},
};

// Async thunk for generating context suggestions
export const generateSuggestedContexts = createAsyncThunk(
    "ai/generateSuggestedContexts",
    async (
        {
            noteId,
            content,
            userId: _userId, // Keep for future use if needed
        }: {
            noteId: string;
            content: string;
            userId: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const suggestions = await suggestContexts({
                noteId,
                content,
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


const aiSlice = createSlice({
    name: "ai",
    initialState,
    reducers: {
        clearSuggestedContexts: (state, action: PayloadAction<string>) => {
            const noteId = action.payload;
            delete state.suggestedContexts[noteId];
        },
        clearEmbedding: (state, action: PayloadAction<string>) => {
            const noteId = action.payload;
            delete state.embeddings[noteId];
        },
        clearAllAI: (state) => {
            state.suggestedContexts = {};
            state.embeddings = {};
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
            })
    },
});

export const { clearSuggestedContexts, clearEmbedding, clearAllAI } = aiSlice.actions;
export default aiSlice.reducer;
