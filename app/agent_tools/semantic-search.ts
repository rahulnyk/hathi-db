"use server";

import { createDb } from "@/db/connection";
import { generateQueryEmbedding } from "@/app/actions/ai";
import { measureExecutionTime } from "@/lib/performance";
import type { SearchResultNote, SemanticSearchParams } from "./types";
import type { NoteType } from "@/store/notesSlice";
import { formatSearchMessage } from "./types";
import { sql } from "drizzle-orm";

/**
 * Interface for the raw semantic search result from the database
 */
interface RawSemanticSearchResult {
    id: string;
    content: string;
    key_context: string | null;
    contexts: string[] | null;
    tags: string[] | null;
    note_type: string | null;
    suggested_contexts: string[] | null;
    created_at: Date;
    similarity: number;
}

/**
 * Result interface for semantic search operations
 */
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
 * Executes the PostgreSQL similarity search function with the given parameters
 *
 * @param embedding - The query embedding vector
 * @param similarityThreshold - Minimum similarity score (0.0-1.0)
 * @param limit - Maximum number of results to return
 * @returns Promise that resolves to raw search results from database
 * @throws Error if database query fails
 */
async function executeSemanticSearchQuery(
    embedding: number[],
    similarityThreshold: number,
    limit: number
): Promise<RawSemanticSearchResult[]> {
    const db = createDb();

    try {
        // Connect the client before using it
        await db.$client.connect();

        // Execute the PostgreSQL function using Drizzle's sql template
        const result = await db.execute(
            sql`
                SELECT * FROM search_notes_by_similarity(
                    ${JSON.stringify(embedding)}::vector,
                    ${similarityThreshold}::float,
                    ${limit}::integer
                )
            `
        );

        // Safely cast the result rows with proper type validation
        return result.rows.map((row): RawSemanticSearchResult => {
            const record = row as Record<string, unknown>;
            return {
                id: String(record.id),
                content: String(record.content),
                key_context: record.key_context
                    ? String(record.key_context)
                    : null,
                contexts: Array.isArray(record.contexts)
                    ? (record.contexts as string[])
                    : null,
                tags: Array.isArray(record.tags)
                    ? (record.tags as string[])
                    : null,
                note_type: record.note_type ? String(record.note_type) : null,
                suggested_contexts: Array.isArray(record.suggested_contexts)
                    ? (record.suggested_contexts as string[])
                    : null,
                created_at: new Date(String(record.created_at)),
                similarity: Number(record.similarity),
            };
        });
    } catch (error) {
        console.error("Error executing semantic search query:", error);
        throw new Error(
            error instanceof Error
                ? `Database query failed: ${error.message}`
                : "Failed to execute semantic search query"
        );
    } finally {
        // Clean up database connection
        try {
            await db.$client.end();
        } catch (cleanupError) {
            console.warn(
                "Warning: Failed to close database connection:",
                cleanupError
            );
        }
    }
}

/**
 * Transforms raw database results into the expected SearchResultNote format
 *
 * @param rawResults - Raw results from the database query
 * @returns Array of formatted search result notes
 */
function transformSearchResults(
    rawResults: RawSemanticSearchResult[]
): SearchResultNote[] {
    return rawResults.map(
        (note): SearchResultNote => ({
            id: note.id,
            content: note.content,
            key_context: note.key_context ?? undefined,
            contexts: note.contexts ?? [],
            tags: note.tags ?? [],
            note_type: (note.note_type as NoteType) ?? undefined,
            suggested_contexts: note.suggested_contexts ?? [],
            created_at: note.created_at.toISOString(),
            similarity: note.similarity,
            persistenceStatus: "persisted" as const,
            // Add optional fields that might be missing in semantic search results
            deadline: undefined,
            status: undefined,
        })
    );
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

            // Step 2: Execute the semantic search query
            const rawResults = await executeSemanticSearchQuery(
                queryEmbedding,
                similarityThreshold,
                limit
            );

            // Step 3: Transform results to the expected format
            const formattedNotes = transformSearchResults(rawResults);

            // Step 4: Generate response message
            const message = generateSearchMessage(
                formattedNotes.length,
                query,
                similarityThreshold
            );

            return {
                notes: formattedNotes,
                totalCount: formattedNotes.length,
                message,
                appliedFilters: {
                    query: query.trim(),
                    similarityThreshold,
                    limit,
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
