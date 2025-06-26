import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type DeviceType = "mobile" | "tablet" | "desktop";

interface UIState {
    deviceType: DeviceType;
    datePickerSelectedDate: string; // Store as ISO string to ensure serialization
    activeNoteId: string | null;
}

const initialState: UIState = {
    deviceType: "desktop", // default
    datePickerSelectedDate: new Date().toISOString(),
    activeNoteId: null,
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
            state.activeNoteId = action.payload;
        },
    },
});

export const {
    setDeviceType,
    setDatePickerSelectedDate,
    resetDatePickerToToday,
    setActiveNoteId,
} = uiSlice.actions;
export default uiSlice.reducer;
