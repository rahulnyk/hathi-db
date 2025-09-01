"use server";

import { databaseAdapter } from "@/db/postgres/adapter";
import { generateQueryEmbedding } from "@/app/actions/ai";
import { measureExecutionTime } from "@/lib/performance";
import type { SemanticSearchParams, SemanticSearchResult } from "@/db/types";
import { formatSearchMessage } from "./types";

/**
 * Generates an embedding vector for the given query text
 *
 * @param query - The search query text
 * @returns Promise that resolves to the embedding vector
 * @throws Error if embedding generation fails
 */
async function generateSearchEmbedding(query: string): Promise<number[]> {
    try {
        const embedding = await generateQueryEmbedding({ question: query });

        if (!Array.isArray(embedding) || embedding.length === 0) {
            throw new Error("Invalid embedding format received");
        }

        return embedding;
    } catch (error) {
        console.error("Error generating query embedding:", error);
        throw new Error(
            error instanceof Error
                ? `Failed to generate embedding: ${error.message}`
                : "Failed to generate embedding for the search query"
        );
    }
}

/**
 * Generates an appropriate message based on search results
 *
 * @param resultCount - Number of results found
 * @param query - The original search query
 * @param similarityThreshold - The similarity threshold used
 * @returns Human-readable message describing the search results
 */
function generateSearchMessage(
    resultCount: number,
    query: string,
    similarityThreshold: number
): string {
    if (resultCount > 0) {
        return formatSearchMessage(resultCount, resultCount, "semantic", query);
    }

    return (
        `No notes found with similarity >= ${similarityThreshold} for "${query}". ` +
        "Try lowering the similarity threshold or using different keywords."
    );
}

/**
 * Search notes using semantic similarity based on embeddings
 *
 * This function performs a semantic search on notes using vector embeddings.
 * It generates an embedding for the query, then uses PostgreSQL's pgvector
 * extension to find notes with similar embeddings above the threshold.
 *
 * @param params - Search parameters
 * @param params.query - The search query text
 * @param params.similarityThreshold - Minimum similarity score (0.0-1.0)
 * @param params.limit - Maximum number of results to return
 * @returns Promise that resolves to search results with similarity scores
 * @throws Error if embedding generation or database query fails
 *
 * @example
 * ```typescript
 * const results = await searchNotesBySimilarity({
 *   query: "machine learning projects",
 *   similarityThreshold: 0.7,
 *   limit: 10
 * });
 * ```
 */
export async function searchNotesBySimilarity({
    query,
    similarityThreshold = 0.7,
    limit = 10,
}: SemanticSearchParams): Promise<SemanticSearchResult> {
    return measureExecutionTime("searchNotesBySimilarity", async () => {
        // Validate input parameters
        if (!query || typeof query !== "string" || query.trim().length === 0) {
            throw new Error(
                "Query parameter is required and must be a non-empty string"
            );
        }

        if (similarityThreshold < 0 || similarityThreshold > 1) {
            throw new Error("Similarity threshold must be between 0.0 and 1.0");
        }

        if (limit <= 0 || limit > 1000) {
            throw new Error("Limit must be between 1 and 1000");
        }

        try {
            // Step 1: Generate embedding for the search query
            const queryEmbedding = await generateSearchEmbedding(query.trim());

            // Step 2: Execute the semantic search query using the database adapter
            const result = await databaseAdapter.executeSemanticSearch(
                queryEmbedding,
                similarityThreshold,
                limit
            );

            // Step 3: Generate response message and update the result
            const message = generateSearchMessage(
                result.notes.length,
                query,
                similarityThreshold
            );

            return {
                ...result,
                message,
                appliedFilters: {
                    ...result.appliedFilters,
                    query: query.trim(),
                },
            };
        } catch (error) {
            console.error("Error in searchNotesBySimilarity:", error);

            // Re-throw with a more descriptive error message
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred during semantic search"
            );
        }
    });
}
