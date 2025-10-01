"use server";

import { createSqliteDb } from "@/db/sqlite/connection";
import { notes } from "@/db/sqlite/schema";
import { sql } from "drizzle-orm";
import { DATE_SLUG_PATTERN } from "@/lib/utils";

/**
 * Fetches a distinct list of date slugs from the database that have at least one note.
 * This function specifically looks for 'key_context' values that match the date slug format 'dd-month-yyyy'.
 *
 * @returns {Promise<string[]>} A promise that resolves to an array of date slug strings.
 * If the query fails, it logs the error and returns an empty array.
 */
export async function getDatesWithNotes(): Promise<string[]> {
    try {
        const db = createSqliteDb();

        // Select distinct key_context values.
        // The GLOB '*-*-*' is a broad but efficient initial filter on the database side
        // to find strings with at least two hyphens, which is characteristic of our date slugs.
        const result = await db
            .selectDistinct({
                dateSlug: notes.key_context,
            })
            .from(notes)
            .where(sql`${notes.key_context} GLOB ${"*-*-*"}`);

        // A more precise regex is used here to filter the results further.
        // This ensures we only get slugs that strictly match the 'dd-month-yyyy' format.
        const dateSlugs = result
            .map((row: { dateSlug: string | null }) => row.dateSlug)
            .filter(
                (slug): slug is string =>
                    slug !== null && DATE_SLUG_PATTERN.test(slug)
            );

        return dateSlugs;
    } catch (error) {
        console.error("Failed to fetch dates with notes:", {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
        });
        // Return an empty array on failure to prevent client-side crashes.
        return [];
    }
}
