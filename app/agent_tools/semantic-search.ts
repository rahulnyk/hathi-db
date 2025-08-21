"use server";

import { createClient } from "@/lib/supabase/server";
import { generateQueryEmbedding } from "@/app/actions/ai";
import { measureExecutionTime } from "@/lib/performance";
import { DEFAULT_SEARCH_LIMIT, QA_SEARCH_LIMITS } from "@/lib/constants/qa";
import type { SearchResultNote, SemanticSearchParams } from "./types";
import { formatSearchMessage } from "./types";

export interface SemanticSearchResult {
    notes: SearchResultNote[];
    totalCount: number;
    message: string;
    appliedFilters: {
        query: string;
        similarityThreshold: number;
        limit: number;
    };
}

/**
 * Search notes using semantic similarity based on embeddings
 *
 * @param params - Search parameters including query, similarity threshold, and limit
 * @returns Promise that resolves to search results with similarity scores
 */
export async function searchNotesBySimilarity({
    query,
    similarityThreshold = QA_SEARCH_LIMITS.HIGH_SIMILARITY_THRESHOLD,
    limit = DEFAULT_SEARCH_LIMIT,
}: SemanticSearchParams): Promise<SemanticSearchResult> {
    return measureExecutionTime("searchNotesBySimilarity", async () => {
        try {
            const supabase = await createClient();

            // Generate query embedding
            let queryEmbedding;
            try {
                queryEmbedding = await generateQueryEmbedding({
                    question: query,
                });
            } catch (embeddingError) {
                console.error(
                    "Error generating query embedding:",
                    embeddingError
                );
                throw new Error(
                    "Failed to generate embedding for the search query"
                );
            }

            // Use the existing semantic search function
            const { data: notes, error } = await supabase.rpc(
                "search_notes_by_similarity",
                {
                    p_query_embedding: queryEmbedding,
                    p_similarity_threshold: similarityThreshold,
                    p_limit: limit,
                }
            );

            if (error) {
                console.error("Error in semantic search:", error);
                throw new Error(`Semantic search failed: ${error.message}`);
            }

            const searchResults = notes || [];

            return {
                notes: searchResults.map((note: SearchResultNote) => ({
                    ...note,
                    persistenceStatus: "persisted" as const,
                })),
                totalCount: searchResults.length,
                message:
                    searchResults.length > 0
                        ? formatSearchMessage(
                              searchResults.length,
                              searchResults.length,
                              "semantic",
                              query
                          )
                        : `No notes found with similarity >= ${similarityThreshold} for "${query}". Try lowering the similarity threshold or using different keywords.`,
                appliedFilters: {
                    query,
                    similarityThreshold,
                    limit,
                },
            };
        } catch (error) {
            console.error("Error in searchNotesBySimilarity:", error);
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "Unknown error in semantic search"
            );
        }
    });
}
