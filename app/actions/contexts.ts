"use server";

import { createClient } from "@/lib/supabase/server";
import { measureExecutionTime } from "@/lib/performance";

/**
 * Represents the statistics for a single context.
 */
export interface ContextStatParams {
    context: string;
    count: number;
    lastUsed: string; // ISO 8601 timestamp string
}

/**
 * Represents paginated context statistics response.
 */
export interface PaginatedContextStats {
    contexts: ContextStatParams[];
    totalCount: number;
    hasMore: boolean;
}

/**
 * Parameters for fetching paginated context stats.
 */
export interface FetchContextStatsParams {
    limit?: number;
    offset?: number;
    searchTerm?: string;
}

/**
 * Fetches statistics for all distinct contexts.
 * This includes the occurrence count and the most recent usage timestamp for each context.
 *
 * This action relies on the `get_user_context_stats` PostgreSQL function, which must be
 * created in the Supabase database for this to work.
 *
 * @returns A promise that resolves to an array of ContextStatParams objects,
 *          sorted by count and then by last used date in descending order.
 */
export async function fetchContextStats(): Promise<ContextStatParams[]> {
    return measureExecutionTime("fetchContextStats", async () => {
        const supabase = await createClient();

        try {
            // Call the database function `get_user_context_stats`.
            // The function performs all the complex aggregation on the database side.
            const { data, error } = await supabase.rpc(
                "get_user_context_stats"
            );

            if (error) {
                console.error(
                    "Supabase RPC error fetching context stats:",
                    error
                );
                throw error;
            }

            // The RPC call returns data in the exact shape of the ContextStatParams interface.
            return data || [];
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
        const { limit = 30, offset = 0, searchTerm } = params;
        const supabase = await createClient();

        try {
            const { data, error } = await supabase.rpc(
                "get_user_context_stats_paginated",
                {
                    p_limit: limit,
                    p_offset: offset,
                    p_search_term: searchTerm || null,
                }
            );

            if (error) {
                console.error(
                    "Supabase RPC error fetching paginated context stats:",
                    error
                );
                throw error;
            }

            const contexts = (data || []).map(
                (row: {
                    context: string;
                    count: number;
                    lastUsed: string;
                    total_count: number;
                }) => ({
                    context: row.context,
                    count: row.count,
                    lastUsed: row.lastUsed,
                })
            );

            const totalCount =
                data && data.length > 0 ? data[0].total_count : 0;
            const hasMore = offset + contexts.length < totalCount;

            return {
                contexts,
                totalCount,
                hasMore,
            };
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
): Promise<ContextStatParams[]> {
    return measureExecutionTime("searchContexts", async () => {
        if (!searchTerm.trim()) {
            return [];
        }

        const supabase = await createClient();

        try {
            const { data, error } = await supabase.rpc("search_user_contexts", {
                p_search_term: searchTerm.trim(),
                p_limit: limit,
            });

            if (error) {
                console.error("Supabase RPC error searching contexts:", error);
                throw error;
            }

            return data || [];
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
