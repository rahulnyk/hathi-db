/**
 * User Preferences Client Utilities
 *
 * Handles loading and saving user preferences via API calls.
 * File system operations are handled server-side in the API routes.
 */

import {
    UserPreferences,
    DEFAULT_USER_PREFERENCES,
} from "./user-preferences-types";

/**
 * Load user preferences from the server
 * Returns default preferences if request fails
 */
export async function loadUserPreferences(): Promise<UserPreferences> {
    try {
        const response = await fetch("/api/preferences");

        if (!response.ok) {
            console.log("Failed to load preferences from server, using defaults");
            return DEFAULT_USER_PREFERENCES;
        }

        const preferences = await response.json() as UserPreferences;

        // Merge with defaults to ensure all preferences exist
        // This handles cases where new preferences are added in updates
        return {
            ...DEFAULT_USER_PREFERENCES,
            ...preferences,
        };
    } catch (error) {
        console.error("Error loading user preferences:", error);
        console.log("Using default preferences");
        return DEFAULT_USER_PREFERENCES;
    }
}

/**
 * Save user preferences to the server
 */
export async function saveUserPreferences(
    preferences: UserPreferences
): Promise<void> {
    try {
        const response = await fetch("/api/preferences", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(preferences),
        });

        if (!response.ok) {
            throw new Error(`Failed to save preferences: ${response.statusText}`);
        }

        console.log("User preferences saved successfully");
    } catch (error) {
        console.error("Error saving user preferences:", error);
        throw error;
    }
}
