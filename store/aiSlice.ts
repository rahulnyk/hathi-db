import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    suggestContexts as suggestContextsAction,
    generateEmbedding as generateEmbeddingAction,
    structurizeNote as structurizeNoteAction,
} from "@/app/actions/ai";
import { patchNote } from "@/app/actions/notes";
import {
    updateNoteWithSuggestedContexts,
    updateNoteContent,
} from "@/store/notesSlice";
import { sentenceCaseToSlug } from "@/lib/utils";
// Types for AI-generated data
export interface SuggestedContexts {
    suggestions: string[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error?: string;
}

export interface StructurizedNoteState {
    status: "idle" | "loading" | "succeeded" | "failed";
    structuredContent?: string;
    originalContent?: string; // Store original content for undo functionality
    error?: string;
}

interface AIState {
    suggestedContexts: {
        [noteId: string]: SuggestedContexts;
    };
    structurizedNote: {
        [noteId: string]: StructurizedNoteState;
    };
}

const initialState: AIState = {
    suggestedContexts: {},
    structurizedNote: {},
};

// Async thunk for generating context suggestions
export const generateSuggestedContexts = createAsyncThunk(
    "ai/generateSuggestedContexts",
    async (
        {
            noteId,
            content,
        }: {
            noteId: string;
            content: string;
        },
        { rejectWithValue, dispatch }
    ) => {
        // Clear any existing suggestions for this note
        dispatch(clearSuggestedContexts(noteId));

        try {
            const suggestionsResponse = await suggestContextsAction({
                content,
            });

            // Slugify each suggestion using sentenceCaseToSlug
            const suggestions = suggestionsResponse.map((ctx) =>
                sentenceCaseToSlug(ctx)
            );

            // Dispatch action to update the note in Redux store immediately
            dispatch(
                updateNoteWithSuggestedContexts({
                    noteId,
                    suggestions,
                })
            );

            // Update the note optimistically in the database
            await patchNote({
                noteId,
                patches: {
                    suggested_contexts: suggestions,
                },
            });

            return { noteId, suggestions };
        } catch (error: any) {
            return rejectWithValue({
                noteId,
                error:
                    error?.message || "Failed to generate context suggestions",
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
            const structuredContent = await structurizeNoteAction({
                content,
            });

            // Return both original and structured content for preview mode
            return { noteId, structuredContent, originalContent: content };
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
        }: {
            noteId: string;
            content: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const embedding = await generateEmbeddingAction({
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

// Async thunk for accepting structured content
export const acceptStructurizedNoteThunk = createAsyncThunk(
    "ai/acceptStructurizedNote",
    async (
        {
            noteId,
            structuredContent,
        }: {
            noteId: string;
            structuredContent: string;
        },
        { rejectWithValue, dispatch }
    ) => {
        try {
            // Update the note content in the database
            await patchNote({
                noteId,
                patches: {
                    content: structuredContent,
                },
            });

            // Update the note content in Redux store
            dispatch(updateNoteContent({ noteId, content: structuredContent }));

            return { noteId };
        } catch (error: any) {
            return rejectWithValue({
                noteId,
                error: error?.message || "Failed to save structured note",
            });
        }
    }
);

// Async thunk for rejecting structured content (undo)
export const rejectStructurizedNoteThunk = createAsyncThunk(
    "ai/rejectStructurizedNote",
    async (
        {
            noteId,
        }: {
            noteId: string;
        },
        { rejectWithValue }
    ) => {
        try {
            // Just return success - no database update needed for undo
            return { noteId };
        } catch (error: any) {
            return rejectWithValue({
                noteId,
                error: error?.message || "Failed to undo structurization",
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
            delete state.structurizedNote[noteId];
        },
        clearAllAI: (state) => {
            state.suggestedContexts = {};
            state.structurizedNote = {};
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
                const { noteId, error } = action.payload as {
                    noteId: string;
                    error: string;
                };
                state.suggestedContexts[noteId] = {
                    suggestions: [],
                    status: "failed",
                    error,
                };
            })
            // Structurize Note
            .addCase(structurizeNoteThunk.pending, (state, action) => {
                const noteId = action.meta.arg.noteId;
                state.structurizedNote[noteId] = {
                    status: "loading",
                };
            })
            .addCase(structurizeNoteThunk.fulfilled, (state, action) => {
                const { noteId, structuredContent, originalContent } =
                    action.payload;
                state.structurizedNote[noteId] = {
                    status: "succeeded",
                    structuredContent,
                    originalContent,
                };
            })
            .addCase(structurizeNoteThunk.rejected, (state, action) => {
                const { noteId, error } = action.payload as {
                    noteId: string;
                    error: string;
                };
                state.structurizedNote[noteId] = {
                    status: "failed",
                    error,
                };
            })
            // Accept Structurize Note
            .addCase(acceptStructurizedNoteThunk.pending, (state, action) => {
                const noteId = action.meta.arg.noteId;
                // Keep the current state but mark as processing
                if (state.structurizedNote[noteId]) {
                    state.structurizedNote[noteId].status = "loading";
                }
            })
            .addCase(acceptStructurizedNoteThunk.fulfilled, (state, action) => {
                const { noteId } = action.payload;
                // Clear the structurize state since it's been accepted
                delete state.structurizedNote[noteId];
            })
            .addCase(acceptStructurizedNoteThunk.rejected, (state, action) => {
                const { noteId, error } = action.payload as {
                    noteId: string;
                    error: string;
                };
                if (state.structurizedNote[noteId]) {
                    state.structurizedNote[noteId].status = "failed";
                    state.structurizedNote[noteId].error = error;
                }
            })
            // Reject Structurize Note
            .addCase(rejectStructurizedNoteThunk.pending, (state, action) => {
                const noteId = action.meta.arg.noteId;
                // Keep the current state but mark as processing
                if (state.structurizedNote[noteId]) {
                    state.structurizedNote[noteId].status = "loading";
                }
            })
            .addCase(rejectStructurizedNoteThunk.fulfilled, (state, action) => {
                const { noteId } = action.payload;
                // Clear the structurize state since it's been rejected
                delete state.structurizedNote[noteId];
            })
            .addCase(rejectStructurizedNoteThunk.rejected, (state, action) => {
                const { noteId, error } = action.payload as {
                    noteId: string;
                    error: string;
                };
                if (state.structurizedNote[noteId]) {
                    state.structurizedNote[noteId].status = "failed";
                    state.structurizedNote[noteId].error = error;
                }
            });
    },
});

export const { clearSuggestedContexts, clearStructurizeNote, clearAllAI } =
    aiSlice.actions;
export default aiSlice.reducer;
