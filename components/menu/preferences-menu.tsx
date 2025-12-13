"use client";

import { useAppSelector, useAppDispatch } from "@/store";
import { updatePreference } from "@/store/userPreferencesSlice";
import { Switch } from "@/components/ui/switch";
import { saveUserPreferences } from "@/lib/user-preferences";
import { AIConfigSection } from "./ai-config-section";
import { useTheme } from "next-themes";

export function PreferencesMenu() {
    const dispatch = useAppDispatch();
    const { theme, setTheme } = useTheme();
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

    const handleThemeChange = (checked: boolean) => {
        setTheme(checked ? "dark" : "light");
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            <h2 className="text-base font-semibold text-foreground">
                Preferences
            </h2>

            {/* Theme Preference */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h3 className="text-xs font-medium text-foreground mb-0.5">
                        Dark Mode
                    </h3>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                        Toggle between light and dark theme
                    </p>
                </div>
                <Switch
                    className="scale-75 origin-right"
                    checked={theme === "dark"}
                    onCheckedChange={handleThemeChange}
                    aria-label="Dark mode"
                />
            </div>

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
                    aria-label={preferences.enterToSubmit.display_name}
                />
            </div>

            {/* Auto Context Preference */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h3 className="text-xs font-medium text-foreground mb-0.5">
                        {preferences.autoContext.display_name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                        {preferences.autoContext.description}
                    </p>
                </div>
                <Switch
                    className="scale-75 origin-right"
                    checked={preferences.autoContext.value}
                    onCheckedChange={(checked) =>
                        handlePreferenceChange("autoContext", checked)
                    }
                    aria-label={preferences.autoContext.display_name}
                />
            </div>

            {/* Divider */}
            <div className="border-t border-foreground/20 my-1" />

            {/* AI Configuration Section */}
            <AIConfigSection />
        </div>
    );
}
