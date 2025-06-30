import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type DeviceType = "mobile" | "tablet" | "desktop";

interface UIState {
    deviceType: DeviceType;
    datePickerSelectedDate: string; // Store as ISO string to ensure serialization
    activeNoteId: string | null;
    editingNoteId: string | null; // Added for tracking the note being edited
}

const initialState: UIState = {
    deviceType: "desktop", // default
    datePickerSelectedDate: new Date().toISOString(),
    activeNoteId: null,
    editingNoteId: null, // Initialize editingNoteId
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setDeviceType(state, action: PayloadAction<DeviceType>) {
            state.deviceType = action.payload;
        },
        setDatePickerSelectedDate: (state, action: PayloadAction<string>) => {
            state.datePickerSelectedDate = action.payload;
        },
        resetDatePickerToToday: (state) => {
            state.datePickerSelectedDate = new Date().toISOString();
        },
        setActiveNoteId: (state, action: PayloadAction<string | null>) => {
            if (action.payload === state.editingNoteId) {
                return; // Prevent setting active note if it is the same as the editing note
            }
            state.activeNoteId = action.payload;
            // If a note is being activated, ensure no note is in editing mode.
            if (action.payload !== null) {
                state.editingNoteId = null;
            }
        },
        setEditingNoteId: (state, action: PayloadAction<string | null>) => {
            state.editingNoteId = action.payload;
            // If a note is being set to editing mode, ensure no note is active.
            if (action.payload !== null) {
                state.activeNoteId = null;
            }
        },
    },
});

export const {
    setDeviceType,
    setDatePickerSelectedDate,
    resetDatePickerToToday,
    setActiveNoteId,
    setEditingNoteId, // Export the new action
} = uiSlice.actions;
export default uiSlice.reducer;
