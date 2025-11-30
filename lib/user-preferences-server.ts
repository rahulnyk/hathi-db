/**
 * Server-side User Preferences File System Utilities
 *
 * Handles reading and writing user preferences to the file system.
 * This file should only be imported in server-side code (API routes).
 */

import fs from "fs";
import path from "path";
import {
    UserPreferences,
    DEFAULT_USER_PREFERENCES,
} from "./user-preferences-types";

const PREFERENCES_FILE_PATH = path.join(
    process.cwd(),
    "data",
    "user-preferences.json"
);

/**
 * Load user preferences from the file system (server-side only)
 * Returns default preferences if file doesn't exist or is invalid
 */
export async function loadUserPreferencesFromFile(): Promise<UserPreferences> {
    try {
        // Check if file exists
        if (!fs.existsSync(PREFERENCES_FILE_PATH)) {
            console.log(
                "User preferences file not found, using defaults:",
                PREFERENCES_FILE_PATH
            );
            return DEFAULT_USER_PREFERENCES;
        }

        // Read and parse the file
        const fileContent = await fs.promises.readFile(
            PREFERENCES_FILE_PATH,
            "utf-8"
        );
        const preferences = JSON.parse(fileContent) as UserPreferences;

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
 * Save user preferences to the file system (server-side only)
 */
export async function saveUserPreferencesToFile(
    preferences: UserPreferences
): Promise<void> {
    try {
        // Ensure data directory exists
        const dataDir = path.dirname(PREFERENCES_FILE_PATH);
        if (!fs.existsSync(dataDir)) {
            await fs.promises.mkdir(dataDir, { recursive: true });
        }

        // Write preferences to file
        await fs.promises.writeFile(
            PREFERENCES_FILE_PATH,
            JSON.stringify(preferences, null, 2),
            "utf-8"
        );

        console.log("User preferences saved successfully");
    } catch (error) {
        console.error("Error saving user preferences:", error);
        throw error;
    }
}
