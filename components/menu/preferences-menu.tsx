"use client";

import { useAppSelector, useAppDispatch } from "@/store";
import { updatePreference } from "@/store/userPreferencesSlice";
import { Switch } from "@/components/ui/switch";
import { saveUserPreferences } from "@/lib/user-preferences";
import { AIConfigSection } from "./ai-config-section";

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
            <h2 className="text-base font-semibold text-foreground">
                Preferences
            </h2>

            {/* Enter to Submit Preference */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h3 className="text-xs font-medium text-foreground mb-0.5">
                        {preferences.enterToSubmit.display_name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                        {preferences.enterToSubmit.description}
                    </p>
                </div>
                <Switch
                    className="scale-75 origin-right"
                    checked={preferences.enterToSubmit.value}
                    onCheckedChange={(checked) =>
                        handlePreferenceChange("enterToSubmit", checked)
                    }
                />
            </div>

            {/* Divider */}
            <div className="border-t border-foreground/20 my-1" />

            {/* AI Configuration Section */}
            <AIConfigSection />
        </div>
    );
}
