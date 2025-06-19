import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type DeviceType = "mobile" | "tablet" | "desktop";

interface UIState {
    deviceType: DeviceType;
    datePickerSelectedDate: string; // Store as ISO string to ensure serialization
}

const initialState: UIState = {
    deviceType: "desktop", // default
    datePickerSelectedDate: new Date().toISOString(),
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
    },
});

export const {
    setDeviceType,
    setDatePickerSelectedDate,
    resetDatePickerToToday,
} = uiSlice.actions;
export default uiSlice.reducer;
