import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DraftState {
    content: string;
}

const initialState: DraftState = {
    content: "",
};

const draftSlice = createSlice({
    name: "draft",
    initialState,
    reducers: {
        // Update draft content
        updateDraftContent: (state, action: PayloadAction<string>) => {
            state.content = action.payload;
        },

        // Clear draft content
        clearDraft: (state) => {
            state.content = "";
        },
    },
});

export const { updateDraftContent, clearDraft } = draftSlice.actions;
export default draftSlice.reducer;
