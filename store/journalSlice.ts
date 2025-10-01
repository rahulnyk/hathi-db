import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getDatesWithNotes } from "@/app/actions/journal";
import type { RootState, AppDispatch } from ".";

/**
 * Defines the shape of the journal state, including the list of dates
 * that have notes and the status of the async fetch operation.
 */
interface JournalState {
    datesWithNotes: string[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
}

/**
 * The initial state for the journal slice.
 */
const initialState: JournalState = {
    datesWithNotes: [],
    status: "idle", // 'idle' means the data has not been fetched yet.
    error: null,
};

/**
 * An async thunk to fetch the dates that have notes from the server.
 * It uses the `getDatesWithNotes` server action and includes intelligent caching.
 * The thunk's state (pending, fulfilled, rejected) is handled by the extraReducers.
 *
 * @param params - Configuration object
 * @param params.forceRefresh - If true, bypasses cache and fetches fresh data from server
 *                             If false/undefined, returns cached data if available
 */
export const fetchDatesWithNotes = createAsyncThunk<
    string[], // Return type of the payload
    { forceRefresh?: boolean } | void, // First argument to the payload creator
    { rejectValue: string } // Types for thunkAPI
>(
    "journal/fetchDatesWithNotes",
    async (params, { rejectWithValue, getState }) => {
        try {
            // If not forcing refresh, check if we already have data
            if (!params?.forceRefresh) {
                const state = getState() as { journal: JournalState };
                const currentStatus = state.journal.status;

                // If we already have succeeded data and not forcing refresh, return current data (even if it's an empty array)
                if (currentStatus === "succeeded") {
                    return state.journal.datesWithNotes;
                }
            }

            const dates = await getDatesWithNotes();
            return dates;
        } catch (error) {
            console.error("Redux thunk error:", error);
            return rejectWithValue("Failed to fetch dates with notes.");
        }
    }
);

/**
 * The journal slice, containing the reducer and actions for managing journal-related state.
 */
const journalSlice = createSlice({
    name: "journal",
    initialState,
    reducers: {
        /**
         * Clears the cached dates with notes and resets status to idle.
         * This forces a fresh fetch on the next request.
         */
        clearDatesCache: (state) => {
            state.datesWithNotes = [];
            state.status = "idle";
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Handle fetchDatesWithNotes (covers both regular fetch and forced refresh)
            .addCase(fetchDatesWithNotes.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(
                fetchDatesWithNotes.fulfilled,
                (state, action: PayloadAction<string[]>) => {
                    state.status = "succeeded";
                    state.datesWithNotes = action.payload;
                    state.error = null;
                }
            )
            .addCase(fetchDatesWithNotes.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Unknown error";
            });
    },
});

/**
 * Selector to get the list of dates with notes from the state.
 * @param {RootState} state The root Redux state.
 * @returns {string[]} An array of date slugs.
 */
export const selectDatesWithNotes = (state: RootState) =>
    state.journal.datesWithNotes;

/**
 * Selector to get the fetch status for dates with notes.
 * @param {RootState} state The root Redux state.
 * @returns {string} The current fetch status.
 */
export const selectDatesWithNotesStatus = (state: RootState) =>
    state.journal.status;

/**
 * Selector to check if dates with notes are currently being loaded.
 * @param {RootState} state The root Redux state.
 * @returns {boolean} True if loading, false otherwise.
 */
export const selectDatesWithNotesLoading = (state: RootState) =>
    state.journal.status === "loading";

/**
 * Convenience function to refresh dates with notes, bypassing any cache.
 * This is equivalent to calling fetchDatesWithNotes({ forceRefresh: true })
 *
 * @param dispatch - The Redux dispatch function
 * @returns Promise that resolves when the refresh is complete
 */
export const refreshDatesWithNotes = (dispatch: AppDispatch) => {
    return dispatch(fetchDatesWithNotes({ forceRefresh: true }));
};
export const { clearDatesCache } = journalSlice.actions;

export default journalSlice.reducer;
