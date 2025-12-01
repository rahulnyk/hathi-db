import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
    UserPreferences,
    DEFAULT_USER_PREFERENCES,
} from "@/lib/user-preferences-types";

interface UserPreferencesState {
    preferences: UserPreferences;
    isLoaded: boolean;
}

const initialState: UserPreferencesState = {
    preferences: DEFAULT_USER_PREFERENCES,
    isLoaded: false,
};

const userPreferencesSlice = createSlice({
    name: "userPreferences",
    initialState,
    reducers: {
        setUserPreferences: (
            state,
            action: PayloadAction<UserPreferences>
        ) => {
            state.preferences = action.payload;
            state.isLoaded = true;
        },
        updatePreference: <K extends keyof UserPreferences>(
            state: UserPreferencesState,
            action: PayloadAction<{
                key: K;
                value: UserPreferences[K]["value"];
            }>
        ) => {
            const { key, value } = action.payload;
            if (state.preferences[key]) {
                state.preferences[key].value = value;
            }
        },
        resetToDefaults: (state) => {
            state.preferences = DEFAULT_USER_PREFERENCES;
        },
    },
});

export const { setUserPreferences, updatePreference, resetToDefaults } =
    userPreferencesSlice.actions;
export default userPreferencesSlice.reducer;
