// import { google } from "@ai-sdk/google";
import { tool } from "ai";
import { z } from "zod";
import { filterNotes, getFilterOptions } from "@/app/agent_tools/filter-notes";
// import { summarizeNotes } from "@/app/agent_tools/summarize-notes";
import { searchNotesBySimilarity } from "@/app/agent_tools/semantic-search";
import type { ToolSet } from "ai";
import type { SearchToolResponse } from "@/app/agent_tools/types";
import { formatSearchMessage } from "@/app/agent_tools/types";

export const tools: ToolSet = {
    filterNotes: tool({
        description:
            "Filter and search notes based on various criteria like date, contexts, note type, and content search. Returns up to 20 notes by default.",
        parameters: z.object({
            createdAfter: z
                .string()
                .optional()
                .describe(
                    "Filter notes created after this date (ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)"
                ),
            createdBefore: z
                .string()
                .optional()
                .describe(
                    "Filter notes created before this date (ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)"
                ),
            contexts: z
                .array(z.string())
                .optional()
                .describe(
                    "Filter notes that contain ALL of these contexts (thematic categories). Multiple contexts are combined with AND logic."
                ),
            noteType: z
                .string()
                .optional()
                .describe(
                    "Filter by note type (e.g., 'note', 'ai-note', 'todo')"
                ),
            limit: z
                .number()
                .min(1)
                .max(30)
                .optional()
                .describe(
                    "Maximum number of notes to return (default: 20, max: 30)"
                ),
        }),
        execute: async (params): Promise<SearchToolResponse> => {
            try {
                const result = await filterNotes(params);
                return {
                    success: true,
                    notes: result.notes,
                    totalCount: result.totalCount,
                    appliedFilters: result.appliedFilters,
                    message: formatSearchMessage(
                        result.notes.length,
                        result.totalCount,
                        "filter"
                    ),
                };
            } catch (error) {
                return {
                    success: false,
                    notes: [],
                    totalCount: 0,
                    appliedFilters: {},
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred",
                    message: "Failed to filter notes. Please try again.",
                };
            }
        },
    }),
    getFilterOptions: tool({
        description:
            "Get available filter options (contexts, hashtags, note types) that the user has in their notes",
        parameters: z.object({}),
        execute: async () => {
            try {
                const options = await getFilterOptions();
                return {
                    success: true,
                    ...options,
                    message: `Found ${options.availableContexts.length} contexts, ${options.availableHashtags.length} , and ${options.availableNoteTypes.length} note types.`,
                };
            } catch (error) {
                return {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred",
                    message: "Failed to get filter options. Please try again.",
                };
            }
        },
    }),
    searchNotesBySimilarity: tool({
        description:
            "Search notes using semantic similarity based on embeddings. This finds notes that are conceptually related to the query, even if they don't contain exact keywords. Perfect for finding notes about similar topics, concepts, or themes.",
        parameters: z.object({
            query: z
                .string()
                .describe(
                    "The search query or question to find semantically similar notes for"
                ),
            similarityThreshold: z
                .number()
                .min(0.3)
                .max(0.9)
                .optional()
                .default(0.7)
                .describe(
                    "Similarity threshold (0.3-0.9). Higher values = more precise matches. Use 0.7 for balanced results, 0.5 for broader matches, 0.8+ for very specific matches."
                ),
            limit: z
                .number()
                .min(1)
                .max(30)
                .optional()
                .default(15)
                .describe(
                    "Maximum number of notes to return (default: 15, max: 30)"
                ),
        }),
        execute: async (params): Promise<SearchToolResponse> => {
            try {
                const result = await searchNotesBySimilarity(params);
                return {
                    success: true,
                    notes: result.notes,
                    totalCount: result.totalCount,
                    appliedFilters: result.appliedFilters,
                    message: result.message,
                };
            } catch (error) {
                return {
                    success: false,
                    notes: [],
                    totalCount: 0,
                    appliedFilters: {},
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred",
                    message:
                        "Failed to perform semantic search. Please try again with different keywords.",
                };
            }
        },
    }),
    // summarizeNotes: tool({
    //     description:
    //         "Generate an AI-powered intelligent summary with key insights, themes, and action items from the provided notes. Uses advanced AI analysis to identify patterns and extract meaningful information.",
    //     parameters: z.object({
    //         noteIds: z
    //             .array(z.string())
    //             .describe(
    //                 "Array of note IDs to summarize. Use this after filtering notes to get their IDs."
    //             ),
    //         includeMetadata: z
    //             .boolean()
    //             .optional()
    //             .default(true)
    //             .describe(
    //                 "Whether to include metadata like creation date and contexts in the summary"
    //             ),
    //     }),
    //     execute: async (params) => {
    //         try {
    //             const result = await summarizeNotes(params);
    //             return result;
    //         } catch (error) {
    //             return {
    //                 success: false,
    //                 summary: "",
    //                 noteCount: 0,
    //                 error:
    //                     error instanceof Error
    //                         ? error.message
    //                         : "Unknown error occurred",
    //                 message:
    //                     "Failed to generate notes summary. Please try again.",
    //             };
    //         }
    //     },
    // }),
    // Final answer tool for providing structured responses
    answer: tool({
        description:
            "Use this tool to provide a final answer to the user's question. DO NOT take any further actions after this step. This should be your last step.",
        parameters: z.object({
            foundNotes: z
                .array(z.string())
                .describe(
                    "Array of note IDs that were found and used to formulate the answer"
                ),
            answer: z
                .string()
                .describe(
                    "The comprehensive answer to the user's question based on the retrieved notes"
                ),
            searchStrategy: z
                .string()
                .optional()
                .describe(
                    "Brief description of what search approach was used (e.g., 'semantic search for AI concepts', 'filtered by work context and date')"
                ),
        }),
        execute: async (params) => {
            return {
                success: true,
                foundNoteIds: params.foundNotes,
                answer: params.answer,
                searchStrategy: params.searchStrategy,
                message: `Found ${params.foundNotes.length} relevant notes and provided comprehensive answer.`,
            };
        },
    }),
};
