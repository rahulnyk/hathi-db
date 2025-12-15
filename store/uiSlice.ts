import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { cn, slugToSentenceCase, dateToSlug } from "@/lib/utils";

export type DeviceType = "mobile" | "tablet" | "desktop";

interface OriginalNoteState {
    content: string;
    contexts: string[];
    tags: string[];
}

interface UIState {
    deviceType: DeviceType;
    datePickerSelectedDate: string | null; // ISO string for serialization, null when no date selected
    activeNoteId: string | null;
    editingNoteId: string | null; // Added for tracking the note being edited
    originalNoteStates: Record<string, OriginalNoteState>; // Store original states by note ID
    isMenuOpen: boolean; // Track if the menu is open
    isNavigatingToContext: boolean; // Track if currently navigating to a context
    todayContext: string; // Track the current date's context slug
    menuMode: "preferences" | "chat"; // Track current menu mode
}

const initialState: UIState = {
    deviceType: "desktop", // default
    datePickerSelectedDate: new Date().toISOString(),
    activeNoteId: null,
    editingNoteId: null, // Initialize editingNoteId
    originalNoteStates: {}, // Initialize empty original note states
    isMenuOpen: true, // Initialize menu as open
    isNavigatingToContext: false, // Initialize context navigation state
    todayContext: dateToSlug(new Date()), // Initialize with current date
    menuMode: "chat", // Initialize with chat menu
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
        clearDatePickerSelection: (state) => {
            state.datePickerSelectedDate = null;
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
        storeOriginalNoteState: (
            state,
            action: PayloadAction<{
                noteId: string;
                originalState: OriginalNoteState;
            }>
        ) => {
            const { noteId, originalState } = action.payload;
            state.originalNoteStates[noteId] = originalState;
        },
        clearOriginalNoteState: (state, action: PayloadAction<string>) => {
            const noteId = action.payload;
            delete state.originalNoteStates[noteId];
        },
        setIsMenuOpen: (state, action: PayloadAction<boolean>) => {
            state.isMenuOpen = action.payload;
        },
        toggleMenu: (state) => {
            state.isMenuOpen = !state.isMenuOpen;
        },
        setIsNavigatingToContext: (state, action: PayloadAction<boolean>) => {
            state.isNavigatingToContext = action.payload;
        },
        setTodayContext: (state, action: PayloadAction<string>) => {
            state.todayContext = action.payload;
        },
        setMenuMode: (state, action: PayloadAction<"preferences" | "chat">) => {
            state.menuMode = action.payload;
        },
    },
});

export const {
    setDeviceType,
    setDatePickerSelectedDate,
    resetDatePickerToToday,
    clearDatePickerSelection,
    setActiveNoteId,
    setEditingNoteId, // Export the new action
    storeOriginalNoteState,
    clearOriginalNoteState,
    setIsMenuOpen,
    toggleMenu,
    setIsNavigatingToContext,
    setTodayContext,
    setMenuMode,
} = uiSlice.actions;
export default uiSlice.reducer;
