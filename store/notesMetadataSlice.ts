import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { fetchContextStats, ContextStat } from "@/app/actions/notes";

// 1. Define the state shape
interface NotesMetadataState {
    contexts: ContextStat[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
}

// 2. Define the initial state
const initialState: NotesMetadataState = {
    contexts: [],
    status: "idle",
    error: null,
};

// 3. Create the async thunk to fetch context stats
export const fetchContextsMetadata = createAsyncThunk<ContextStat[]>(
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

// 4. Create the slice
const notesMetadataSlice = createSlice({
    name: "notesMetadata",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchContextsMetadata.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(
                fetchContextsMetadata.fulfilled,
                (state, action: PayloadAction<ContextStat[]>) => {
                    state.status = "succeeded";
                    state.contexts = action.payload;
                }
            )
            .addCase(fetchContextsMetadata.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
            });
    },
});

export default notesMetadataSlice.reducer;
