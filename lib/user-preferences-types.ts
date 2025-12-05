/**
 * User Preferences Type Definitions
 *
 * Defines the structure for user preferences with display metadata
 * for UI rendering and persistence.
 */

import { UserAIConfig } from "./ai/ai-config-types";

export interface PreferenceSetting<T = unknown> {
    value: T;
    display_name: string;
    description: string;
}

export interface UserPreferences {
    enterToSubmit: PreferenceSetting<boolean>;
    aiConfig: PreferenceSetting<UserAIConfig>;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
    enterToSubmit: {
        value: true,
        display_name: "Enter to Submit",
        description:
            "When enabled, pressing Enter submits the note. When disabled, press Shift+Enter to submit and Enter to add a new line.",
    },
    aiConfig: {
        value: {
            provider: {
                name: "Google",
                apiKey: "",
                baseURL: "",
            },
            textGenerationModel: "gemini-2.5-flash",
            textGenerationLiteModel: "gemini-2.0-flash-lite",
            agentModel: "gemini-2.5-flash",
        },
        display_name: "AI Configuration",
        description: "Configure AI provider, models, and API credentials",
    },
};
