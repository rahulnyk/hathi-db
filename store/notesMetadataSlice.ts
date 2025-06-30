import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    fetchContextStats,
    ContextStatParams,
    fetchContextStatsPaginated,
    FetchContextStatsParams,
} from "@/app/actions/contexts";

// 1. Define the state shape
interface NotesMetadataState {
    contexts: ContextStatParams[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
    hasMore: boolean;
    totalCount: number;
    isLoadingMore: boolean;
}

// 2. Define the initial state
const initialState: NotesMetadataState = {
    contexts: [],
    status: "idle",
    error: null,
    hasMore: false,
    totalCount: 0,
    isLoadingMore: false,
};

// 3. Create the async thunk to fetch context stats (original - keeping for backward compatibility)
export const fetchContextsMetadata = createAsyncThunk<ContextStatParams[]>(
    "notesMetadata/fetchContexts",
    async (_, { rejectWithValue }) => {
        try {
            const stats = await fetchContextStats();
            return stats;
        } catch (error) {
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            return rejectWithValue("An unknown error occurred");
        }
    }
);

// 4. Single async thunk to handle both initial load and pagination
export const fetchContextsPaginated = createAsyncThunk<
    {
        contexts: ContextStatParams[];
        hasMore: boolean;
        totalCount: number;
        isLoadingMore: boolean;
    },
    { reset?: boolean } | undefined,
    { state: { notesMetadata: NotesMetadataState } }
>(
    "notesMetadata/fetchContextsPaginated",
    async (options = {}, { getState, rejectWithValue }) => {
        try {
            const state = getState().notesMetadata;
            const isReset = options.reset || false;
            const offset = isReset ? 0 : state.contexts.length;
            const isLoadingMore = !isReset && state.contexts.length > 0;

            const params: FetchContextStatsParams = {
                limit: 30,
                offset: offset,
            };

            const result = await fetchContextStatsPaginated(params);
            return {
                contexts: result.contexts,
                hasMore: result.hasMore,
                totalCount: result.totalCount,
                isLoadingMore: isLoadingMore,
            };
        } catch (error) {
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            return rejectWithValue("An unknown error occurred");
        }
    }
);

// 6. Create the slice
const notesMetadataSlice = createSlice({
    name: "notesMetadata",
    initialState,
    reducers: {
        // Add a refresh action that resets status to idle to trigger a refetch
        refreshContextsMetadata: (state) => {
            state.status = "idle";
            state.contexts = [];
            state.hasMore = false;
            state.totalCount = 0;
        },
    },
    extraReducers: (builder) => {
        builder
            // Original fetchContextsMetadata
            .addCase(fetchContextsMetadata.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(
                fetchContextsMetadata.fulfilled,
                (state, action: PayloadAction<ContextStatParams[]>) => {
                    state.status = "succeeded";
                    state.contexts = action.payload;
                }
            )
            .addCase(fetchContextsMetadata.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
            })
            // Single paginated fetch thunk
            .addCase(fetchContextsPaginated.pending, (state, action) => {
                if (action.meta.arg?.reset || !state.contexts.length) {
                    // Initial load
                    state.status = "loading";
                } else {
                    // Loading more
                    state.isLoadingMore = true;
                }
                state.error = null;
            })
            .addCase(fetchContextsPaginated.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.isLoadingMore = false;

                if (action.payload.isLoadingMore) {
                    // Append new contexts to existing ones
                    state.contexts = [
                        ...state.contexts,
                        ...action.payload.contexts,
                    ];
                } else {
                    // Replace contexts (initial load or reset)
                    state.contexts = action.payload.contexts;
                }

                state.hasMore = action.payload.hasMore;
                state.totalCount = action.payload.totalCount;
            })
            .addCase(fetchContextsPaginated.rejected, (state, action) => {
                state.status = "failed";
                state.isLoadingMore = false;
                state.error = action.payload as string;
            });
    },
});

export const { refreshContextsMetadata } = notesMetadataSlice.actions;
export default notesMetadataSlice.reducer;
