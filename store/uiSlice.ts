import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
    datePickerSelectedDate: string; // Store as ISO string to ensure serialization
}

const initialState: UIState = {
    datePickerSelectedDate: new Date().toISOString(),
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setDatePickerSelectedDate: (state, action: PayloadAction<string>) => {
            state.datePickerSelectedDate = action.payload;
        },
        resetDatePickerToToday: (state) => {
            state.datePickerSelectedDate = new Date().toISOString();
        },
    },
});

export const { setDatePickerSelectedDate, resetDatePickerToToday } =
    uiSlice.actions;
export default uiSlice.reducer;
