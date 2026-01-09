import {
    createSlice,
    createAsyncThunk,
    PayloadAction,
    Dispatch,
} from "@reduxjs/toolkit";
import {
    suggestContexts as suggestContextsAction,
    generateDocumentEmbedding as generateDocumentEmbeddingAction,
    structurizeNote as structurizeNoteAction,
} from "@/app/actions/ai";
import { patchNote } from "@/app/actions/notes";
import {
    updateNoteWithSuggestedContexts,
    updateNoteContent,
    updateNoteOptimistically,
    Note,
} from "@/store/notesSlice";
import { UpdateNoteParams } from "@/db/types";
import { sentenceCaseToSlug } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { RootState } from ".";
// Types for AI-generated data
export interface SuggestedContexts {
    suggestions: string[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error?: string;
    errorDetails?: {
        retryable: boolean;
        userMessage: string;
    };
    retryCount?: number;
}

export interface StructurizedNoteState {
    status: "idle" | "loading" | "succeeded" | "failed";
    structuredContent?: string;
    originalContent?: string; // Store original content for undo functionality
    error?: string;
    errorDetails?: {
        retryable: boolean;
        userMessage: string;
    };
    retryCount?: number;
}

export interface AIAnswerState {
    isAIAnswer: boolean;
    question?: string;
    answer?: string;
    createdAt?: string;
    relevantSources?: string[]; // Note IDs that were used as context
}

interface AIState {
    suggestedContexts: {
        [noteId: string]: SuggestedContexts;
    };
    structurizedNote: {
        [noteId: string]: StructurizedNoteState;
    };
    aiAnswers: {
        [noteId: string]: AIAnswerState;
    };
}

const initialState: AIState = {
    suggestedContexts: {},
    structurizedNote: {},
    aiAnswers: {},
};

// Helper function to fetch and process context suggestions
async function fetchAndProcessContextSuggestions(
    noteId: string,
    content: string,
    userContexts: string[],
    dispatch?: Dispatch,
    autoContext: boolean = false,
    currentNoteContexts: string[] = []
) {
    const result = await suggestContextsAction({
        content,
        userContexts,
    });

    if (!result.success) {
        throw new Error(result.error);
    }

    const suggestions = result.data.map((ctx) => sentenceCaseToSlug(ctx));

    // Always update database to clear stale suggestions (empty array is valid)
    // But skip Redux updates when empty since there's nothing to display
    const patches: UpdateNoteParams = {
        suggested_contexts: suggestions, // Empty array clears old suggestions
    };

    if (suggestions.length > 0) {
        // We have suggestions - update Redux for UI display
        const mergedContexts = [
            ...new Set([...currentNoteContexts, ...suggestions]),
        ];

        if (dispatch) {
            dispatch(
                updateNoteWithSuggestedContexts({
                    noteId,
                    suggestions,
                })
            );

            if (autoContext) {
                dispatch(
                    updateNoteOptimistically({
                        noteId,
                        patches: {
                            contexts: mergedContexts,
                        },
                    })
                );
                // Add contexts to database patch
                patches.contexts = mergedContexts;
            }
        }
    } else {
        // No suggestions - clear stale data in database
        console.log("No context suggestions for note:", noteId);
    }

    // Always persist to database (clears stale data when empty)
    await patchNote({
        noteId,
        patches,
    });

    return suggestions;
}

// Helper function to fetch and process note structurization
async function fetchAndProcessStructurization(
    content: string,
    userContexts: string[]
) {
    const result = await structurizeNoteAction({
        content,
        userContexts,
    });

    if (!result.success) {
        throw new Error(result.error);
    }

    return result.data;
}

// Async thunk for generating context suggestions
export const generateSuggestedContexts = createAsyncThunk(
    "ai/generateSuggestedContexts",
    async (
        {
            noteId,
            content,
            userContexts,
        }: {
            noteId: string;
            content: string;
            userContexts: string[];
        },
        { rejectWithValue, dispatch, getState }
    ) => {
        // Clear any existing suggestions for this note
        dispatch(clearSuggestedContexts(noteId));

        try {
            const state = getState() as RootState;
            const autoContext =
                state.userPreferences.preferences.autoContext.value;
            const note =
                state.notes.contextNotes.find((n: Note) => n.id === noteId) ||
                state.notes.searchResultNotes.find(
                    (n: Note) => n.id === noteId
                );

            if (!note) {
                console.warn(
                    `generateSuggestedContexts: Note ${noteId} not yet in Redux store (expected for newly created notes)`,
                    {
                        contextNotesCount: state.notes.contextNotes.length,
                        searchResultNotesCount:
                            state.notes.searchResultNotes.length,
                    }
                );
            }

            const currentNoteContexts = note?.contexts ?? [];

            const suggestions = await fetchAndProcessContextSuggestions(
                noteId,
                content,
                userContexts,
                dispatch,
                autoContext,
                currentNoteContexts
            );

            return { noteId, suggestions };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to generate context suggestions";
            return rejectWithValue({
                noteId,
                error: errorMessage,
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
            userContexts,
        }: {
            noteId: string;
            content: string;
            userContexts: string[];
        },
        { rejectWithValue }
    ) => {
        try {
            const structuredContent = await fetchAndProcessStructurization(
                content,
                userContexts
            );

            // Return both original and structured content for preview mode
            return { noteId, structuredContent, originalContent: content };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to structurize note";
            return rejectWithValue({
                noteId,
                error: errorMessage,
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
            contexts,
            tags,
            noteType,
        }: {
            noteId: string;
            content: string;
            contexts?: string[];
            tags?: string[];
            noteType?: string;
        },
        { rejectWithValue }
    ) => {
        try {
            // Use optimized document embedding for better retrieval
            const result = await generateDocumentEmbeddingAction({
                content,
                contexts,
                tags,
                noteType,
            });

            if (!result.success) {
                return rejectWithValue({
                    noteId,
                    error: result.error,
                });
            }

            const { embedding, model } = result.data;

            // Update the note directly in the database without triggering frontend updates
            // since embeddings are not used in the UI
            await patchNote({
                noteId,
                patches: {
                    embedding: embedding,
                    embedding_model: model,
                    embedding_created_at: new Date().toISOString(),
                },
            });

            return { noteId, embedding };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to generate embedding";
            return rejectWithValue({
                noteId,
                error: errorMessage,
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
            contexts,
            tags,
            noteType,
        }: {
            noteId: string;
            structuredContent: string;
            contexts?: string[];
            tags?: string[];
            noteType?: string;
        },
        { rejectWithValue, dispatch }
    ) => {
        try {
            // Update the note content in Redux store
            // This will trigger the notesMiddleware which handles:
            // 1. Metadata extraction (contexts/tags)
            // 2. Database persistence
            // 3. Embedding generation
            dispatch(
                updateNoteOptimistically({
                    noteId,
                    patches: {
                        content: structuredContent,
                    },
                })
            );

            return { noteId };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to save structured note";
            return rejectWithValue({
                noteId,
                error: errorMessage,
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
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to undo structurization";
            return rejectWithValue({
                noteId,
                error: errorMessage,
            });
        }
    }
);
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Retry generating context suggestions for a note
 * This is a user-initiated action, so it will show toast notifications on error
 */
export const retryGenerateSuggestedContexts = createAsyncThunk(
    "ai/retryGenerateSuggestedContexts",
    async (
        {
            noteId,
            content,
            userContexts,
        }: {
            noteId: string;
            content: string;
            userContexts: string[];
        },
        { getState, rejectWithValue, dispatch }
    ) => {
        const state = getState() as RootState;
        const currentState = state.ai.suggestedContexts[noteId];
        const retryCount = (currentState?.retryCount || 0) + 1;

        if (retryCount > MAX_RETRY_ATTEMPTS) {
            return rejectWithValue({
                noteId,
                error: "Maximum retry attempts exceeded. Please try again later.",
                retryCount,
            });
        }

        try {
            const autoContext =
                state.userPreferences.preferences.autoContext.value;
            const note =
                state.notes.contextNotes.find((n: Note) => n.id === noteId) ||
                state.notes.searchResultNotes.find(
                    (n: Note) => n.id === noteId
                );
            const currentNoteContexts = note?.contexts ?? [];

            // Pass dispatch to update the note in Redux store as well
            const suggestions = await fetchAndProcessContextSuggestions(
                noteId,
                content,
                userContexts,
                dispatch,
                autoContext,
                currentNoteContexts
            );

            return { noteId, suggestions, retryCount };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to generate context suggestions";
            return rejectWithValue({
                noteId,
                error: errorMessage,
                retryCount,
            });
        }
    }
);

/**
 * Retry structurizing a note
 * This is a user-initiated action, so it will show toast notifications on error
 */
export const retryStructurizeNote = createAsyncThunk(
    "ai/retryStructurizeNote",
    async (
        {
            noteId,
            content,
            userContexts,
        }: {
            noteId: string;
            content: string;
            userContexts: string[];
        },
        { getState, rejectWithValue }
    ) => {
        const state = getState() as RootState;
        const currentState = state.ai.structurizedNote[noteId];
        const retryCount = (currentState?.retryCount || 0) + 1;

        if (retryCount > MAX_RETRY_ATTEMPTS) {
            return rejectWithValue({
                noteId,
                error: "Maximum retry attempts exceeded. Please try again later.",
                retryCount,
            });
        }

        try {
            const structuredContent = await fetchAndProcessStructurization(
                content,
                userContexts
            );

            return {
                noteId,
                structuredContent,
                originalContent: content,
                retryCount,
            };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to structurize note";
            return rejectWithValue({
                noteId,
                error: errorMessage,
                retryCount,
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
            state.aiAnswers = {};
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
                // Show toast for user-initiated action
                toast.error(error);
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
                toast.error(error);
            })
            // Retry Context Suggestions
            .addCase(
                retryGenerateSuggestedContexts.pending,
                (state, action) => {
                    const { noteId } = action.meta.arg;
                    if (state.suggestedContexts[noteId]) {
                        state.suggestedContexts[noteId].status = "loading";
                    }
                }
            )
            .addCase(
                retryGenerateSuggestedContexts.fulfilled,
                (state, action) => {
                    const { noteId, suggestions, retryCount } = action.payload;
                    state.suggestedContexts[noteId] = {
                        suggestions,
                        status: "succeeded",
                        retryCount,
                    };
                }
            )
            .addCase(
                retryGenerateSuggestedContexts.rejected,
                (state, action) => {
                    const { noteId, error, retryCount } = action.payload as any;
                    if (state.suggestedContexts[noteId]) {
                        state.suggestedContexts[noteId].status = "failed";
                        state.suggestedContexts[noteId].error = error;
                        state.suggestedContexts[noteId].retryCount = retryCount;
                    }
                    toast.error(error);
                }
            )
            // Retry Structurize Note
            .addCase(retryStructurizeNote.pending, (state, action) => {
                const { noteId } = action.meta.arg;
                if (state.structurizedNote[noteId]) {
                    state.structurizedNote[noteId].status = "loading";
                }
            })
            .addCase(retryStructurizeNote.fulfilled, (state, action) => {
                const {
                    noteId,
                    structuredContent,
                    originalContent,
                    retryCount,
                } = action.payload;
                state.structurizedNote[noteId] = {
                    status: "succeeded",
                    structuredContent,
                    originalContent,
                    retryCount,
                };
            })
            .addCase(retryStructurizeNote.rejected, (state, action) => {
                const { noteId, error, retryCount } = action.payload as any;
                if (state.structurizedNote[noteId]) {
                    state.structurizedNote[noteId].status = "failed";
                    state.structurizedNote[noteId].error = error;
                    state.structurizedNote[noteId].retryCount = retryCount;
                }
                toast.error(error);
            });
    },
});

export const { clearSuggestedContexts, clearStructurizeNote, clearAllAI } =
    aiSlice.actions;

// Utility function to check if a note is an AI answer
export const isAIAnswerNote = (state: RootState, noteId: string): boolean => {
    return state.ai.aiAnswers[noteId]?.isAIAnswer || false;
};

// Utility function to get AI answer details
export const getAIAnswerDetails = (
    state: RootState,
    noteId: string
): AIAnswerState | null => {
    return state.ai.aiAnswers[noteId] || null;
};

export default aiSlice.reducer;
