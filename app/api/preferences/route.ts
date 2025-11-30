import { NextResponse } from "next/server";
import {
    loadUserPreferencesFromFile,
    saveUserPreferencesToFile,
} from "@/lib/user-preferences-server";
import { UserPreferences } from "@/lib/user-preferences-types";

/**
 * GET /api/preferences
 *
 * Load user preferences from the file system
 */
export async function GET() {
    try {
        const preferences = await loadUserPreferencesFromFile();
        return NextResponse.json(preferences);
    } catch (error) {
        console.error("Error loading preferences:", error);
        return NextResponse.json(
            { error: "Failed to load preferences" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/preferences
 *
 * Save user preferences to the file system
 */
export async function POST(request: Request) {
    try {
        const preferences = (await request.json()) as UserPreferences;
        await saveUserPreferencesToFile(preferences);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving preferences:", error);
        return NextResponse.json(
            { error: "Failed to save preferences" },
            { status: 500 }
        );
    }
}
