"use client";

import { useAppSelector, useAppDispatch } from "@/store";
import { updatePreference } from "@/store/userPreferencesSlice";
import { Switch } from "@/components/ui/switch";
import { saveUserPreferences } from "@/lib/user-preferences";

export function PreferencesMenu() {
    const dispatch = useAppDispatch();
    const preferences = useAppSelector(
        (state) => state.userPreferences.preferences
    );

    const handlePreferenceChange = async (
        key: keyof typeof preferences,
        value: boolean
    ) => {
        // Update Redux state
        dispatch(updatePreference({ key, value }));

        // Persist to file system
        const updatedPreferences = {
            ...preferences,
            [key]: {
                ...preferences[key],
                value,
            },
        };

        try {
            await saveUserPreferences(updatedPreferences);
        } catch (error) {
            console.error("Failed to save preferences:", error);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            <h2 className="text-lg font-semibold text-foreground">
                Preferences
            </h2>

            {/* Enter to Submit Preference */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-foreground mb-1">
                        {preferences.enterToSubmit.display_name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {preferences.enterToSubmit.description}
                    </p>
                </div>
                <Switch
                    checked={preferences.enterToSubmit.value}
                    onCheckedChange={(checked) =>
                        handlePreferenceChange("enterToSubmit", checked)
                    }
                />
            </div>

            {/* Future preferences can be added here */}
        </div>
    );
}
