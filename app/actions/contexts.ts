"use server";

import { databaseAdapter } from "@/db/adapter";
import { measureExecutionTime } from "@/lib/performance";
import type {
    ContextStats,
    PaginatedContextStats,
    FetchContextStatsParams,
} from "@/db/adapter/types";

/**
 * Fetches statistics for all distinct contexts.
 * This includes the occurrence count and the most recent usage timestamp for each context.
 *
 * This action relies on the `get_user_context_stats` PostgreSQL function, which must be
 * created in the Supabase database for this to work.
 *
 * @returns A promise that resolves to an array of ContextStats objects,
 *          sorted by count and then by last used date in descending order.
 */
export async function fetchContextStats(): Promise<ContextStats[]> {
    return measureExecutionTime("fetchContextStats", async () => {
        try {
            return await databaseAdapter.fetchContextStats();
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Could not fetch context statistics.";
            console.error("Error in fetchContextStats:", errorMessage);
            throw new Error(errorMessage);
        }
    });
}

/**
 * Fetches paginated statistics for distinct contexts.
 * Supports pagination and optional search filtering.
 *
 * @param params - Parameters for pagination and search
 * @returns A promise that resolves to paginated context stats
 */
export async function fetchContextStatsPaginated(
    params: FetchContextStatsParams = {}
): Promise<PaginatedContextStats> {
    return measureExecutionTime("fetchContextStatsPaginated", async () => {
        try {
            return await databaseAdapter.fetchContextStatsPaginated(params);
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Could not fetch paginated context statistics.";
            console.error("Error in fetchContextStatsPaginated:", errorMessage);
            throw new Error(errorMessage);
        }
    });
}

/**
 * Searches contexts.
 * Used for search suggestions and autocomplete functionality.
 *
 * @param searchTerm - The term to search for
 * @param limit - Maximum number of results to return
 * @returns A promise that resolves to an array of matching context stats
 */
export async function searchContexts(
    searchTerm: string,
    limit: number = 20
): Promise<ContextStats[]> {
    return measureExecutionTime("searchContexts", async () => {
        if (!searchTerm.trim()) {
            return [];
        }

        try {
            return await databaseAdapter.searchContexts(searchTerm, limit);
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Could not search contexts.";
            console.error("Error in searchContexts:", errorMessage);
            throw new Error(errorMessage);
        }
    });
}
