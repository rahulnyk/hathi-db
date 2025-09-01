"use server";

import { databaseAdapter } from "@/db/postgres/adapter";
import { measureExecutionTime } from "@/lib/performance";
import type { NotesFilter, FilterNotesResult, FilterOptions } from "@/db/types";

/**
 * Filters and retrieves notes based on given parameters
 * Returns max 20 notes by default, can be configured up to 50
 *
 * @param filters - Filter parameters for notes
 * @returns Promise that resolves to filtered notes with metadata
 */
export async function filterNotes(
    filters: NotesFilter = {}
): Promise<FilterNotesResult> {
    return measureExecutionTime("filterNotes", async () => {
        console.log("Filtering notes with filters:", filters);

        try {
            return await databaseAdapter.filterNotes(filters);
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error in filterNotes:", errorMessage);
            throw new Error(`Failed to filter notes: ${errorMessage}`);
        }
    });
}

/**
 * Helper function to get available filter options for the user
 * Useful for suggesting filter values to the AI
 *
 * @returns Promise that resolves to available filter options
 * @throws Error if database query fails
 */
export async function getFilterOptions(): Promise<FilterOptions> {
    return measureExecutionTime("getFilterOptions", async () => {
        try {
            const filterOptions = await databaseAdapter.getFilterOptions();
            console.log("Available filter options:", filterOptions);
            return filterOptions;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error in getFilterOptions:", errorMessage);
            throw new Error(`Failed to get filter options: ${errorMessage}`);
        }
    });
}
