/**
 * User Preferences Type Definitions
 *
 * Defines the structure for user preferences with display metadata
 * for UI rendering and persistence.
 */

export interface PreferenceSetting<T = unknown> {
    value: T;
    display_name: string;
    description: string;
}

export interface UserPreferences {
    enterToSubmit: PreferenceSetting<boolean>;
    // Future preferences can be added here:
    // geminiApiKey: PreferenceSetting<string>;
    // selectedModel: PreferenceSetting<string>;
    // theme: PreferenceSetting<string>;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
    enterToSubmit: {
        value: true,
        display_name: "Enter to Submit",
        description:
            "When enabled, pressing Enter submits the note. When disabled, press Shift+Enter to submit and Enter to add a new line.",
    },
};
