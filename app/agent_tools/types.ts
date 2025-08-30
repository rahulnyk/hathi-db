/**
 * Shared types for agent tools
 *
 * This file contains common interfaces used across multiple agent tools
 * to ensure consistency in responses and rendering.
 */

import type { SearchResultNote } from "@/db/adapter/types";

/**
 * Unified response interface for all note search tools
 * Used by filterNotes, searchNotesBySimilarity, and other search tools
 */
export interface SearchToolResponse {
    /** Whether the operation was successful */
    success: boolean;
    /** Array of found notes */
    notes: SearchResultNote[];
    /** Total count of matching notes */
    totalCount: number;
    /** Human-readable message about the search results */
    message: string;
    /** Applied search parameters for transparency */
    appliedFilters: Record<string, unknown>;
    /** Error message if operation failed */
    error?: string;
}

/**
 * Parameters for filtered note search
 */
export interface FilterSearchParams {
    createdAfter?: string;
    createdBefore?: string;
    contexts?: string[];
    hashtags?: string[];
    noteType?: string;
    limit?: number;
}

/**
 * Type guard to check if a note has similarity score
 */
export function hasSemanticScore(
    note: SearchResultNote
): note is SearchResultNote & { similarity: number } {
    return typeof note.similarity === "number";
}

/**
 * Helper function to format search results consistently
 */
export function formatSearchMessage(
    notesFound: number,
    totalCount: number,
    searchType: "filter" | "semantic",
    searchTerm?: string
): string {
    const searchTypeText =
        searchType === "semantic" ? "semantically similar" : "matching";
    const baseMessage = `Found ${notesFound} ${searchTypeText} note${
        notesFound === 1 ? "" : "s"
    }`;

    if (searchTerm) {
        const termText =
            searchType === "semantic"
                ? `for "${searchTerm}"`
                : `matching your criteria`;
        return `${baseMessage} ${termText}`;
    }

    if (totalCount > notesFound) {
        return `${baseMessage} (showing ${notesFound} out of ${totalCount} total)`;
    }

    return `${baseMessage}.`;
}

/**
 * Response interface for the summarizeNotes tool
 */
export interface SummarizeToolResponse {
    /** Whether the operation was successful */
    success: boolean;
    /** Generated summary of the notes */
    summary?: string;
    /** Human-readable message about the operation */
    message?: string;
    /** Error message if operation failed */
    error?: string;
}

/**
 * Response interface for the provideAnswer tool
 */
export interface AnswerToolResponse {
    /** Whether the operation was successful */
    success: boolean;
    /** Generated answer */
    answer?: string;
    /** Human-readable message about the operation */
    message?: string;
    /** Error message if operation failed */
    error?: string;
}

/**
 * Response interface for the getFilterOptions tool
 */
export interface FilterOptionsResponse {
    /** Whether the operation was successful */
    success: boolean;
    /** Available filter options */
    options?: {
        contexts?: string[];
        tags?: string[];
        noteTypes?: string[];
    };
    /** Error message if operation failed */
    error?: string;
}
