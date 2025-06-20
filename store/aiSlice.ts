import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { suggestContexts, generateEmbedding, structurizeNote } from "@/app/actions/ai";
import { patchNote } from "@/app/actions/notes";
import { Note, updateNoteWithSuggestedContexts } from "@/store/notesSlice";

// Types for AI-generated data
export interface SuggestedContexts {
    suggestions: string[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error?: string;
}

export interface StructurizeNoteState {
    status: "idle" | "loading" | "succeeded" | "failed";
    structuredContent?: string;
    error?: string;
}

interface AIState {
    suggestedContexts: {
        [noteId: string]: SuggestedContexts;
    };
    structurizeNote: {
        [noteId: string]: StructurizeNoteState;
    };
}

const initialState: AIState = {
    suggestedContexts: {},
    structurizeNote: {},
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

// Async thunk for structurizing notes
export const structurizeNoteThunk = createAsyncThunk(
    "ai/structurizeNote",
    async (
        {
            noteId,
            content,
        }: {
            noteId: string;
            content: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const structuredContent = await structurizeNote({
                content,
            });

            // For now, just log the structured content as requested
            console.log("Structured note content:", structuredContent);

            return { noteId, structuredContent };
        } catch (error: any) {
            return rejectWithValue({
                noteId,
                error: error?.message || "Failed to structurize note",
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
        clearStructurizeNote: (state, action: PayloadAction<string>) => {
            const noteId = action.payload;
            delete state.structurizeNote[noteId];
        },
        clearAllAI: (state) => {
            state.suggestedContexts = {};
            state.structurizeNote = {};
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
            // Structurize Note
            .addCase(structurizeNoteThunk.pending, (state, action) => {
                const noteId = action.meta.arg.noteId;
                state.structurizeNote[noteId] = {
                    status: "loading",
                };
            })
            .addCase(structurizeNoteThunk.fulfilled, (state, action) => {
                const { noteId, structuredContent } = action.payload;
                state.structurizeNote[noteId] = {
                    status: "succeeded",
                    structuredContent,
                };
            })
            .addCase(structurizeNoteThunk.rejected, (state, action) => {
                const { noteId, error } = action.payload as { noteId: string; error: string };
                state.structurizeNote[noteId] = {
                    status: "failed",
                    error,
                };
            });
            // Note: Embedding cases removed since embeddings are handled directly in database
    },
});

export const { clearSuggestedContexts, clearStructurizeNote, clearAllAI } = aiSlice.actions;
export default aiSlice.reducer;
