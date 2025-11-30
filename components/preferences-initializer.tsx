"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store";
import { setUserPreferences } from "@/store/userPreferencesSlice";

/**
 * PreferencesInitializer Component
 *
 * Loads user preferences from the file system on app start
 * and initializes the Redux store with the loaded preferences.
 */
export function PreferencesInitializer() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        async function initializePreferences() {
            try {
                // Fetch preferences from the server
                const response = await fetch("/api/preferences");
                if (response.ok) {
                    const preferences = await response.json();
                    dispatch(setUserPreferences(preferences));
                } else {
                    console.error(
                        "Failed to load preferences, using defaults"
                    );
                }
            } catch (error) {
                console.error("Error loading preferences:", error);
            }
        }

        initializePreferences();
    }, [dispatch]);

    return null; // This component doesn't render anything
}
