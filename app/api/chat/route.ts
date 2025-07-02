import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { filterNotes, getFilterOptions } from "@/app/actions/filter-notes";
import { summarizeNotes } from "@/app/actions/summarize-notes";
import { agentSystemPrompt } from "@/lib/prompts/agent-prompt";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        model: openai("gpt-4o-mini"),
        messages,
        system: agentSystemPrompt(),
        tools: {
            filterNotes: tool({
                description:
                    "Filter and search notes based on various criteria like date, contexts, , note type, and content search. Returns up to 20 notes by default.",
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
                execute: async (params) => {
                    try {
                        const result = await filterNotes(params);
                        return {
                            success: true,
                            notes: result.notes,
                            totalCount: result.totalCount,
                            appliedFilters: result.appliedFilters,
                            message: `Found ${result.notes.length} notes${
                                result.totalCount > result.notes.length
                                    ? ` out of ${result.totalCount} total matching notes`
                                    : ""
                            }.`,
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : "Unknown error occurred",
                            message:
                                "Failed to filter notes. Please try again.",
                        };
                    }
                },
            }),
            getFilterOptions: tool({
                description:
                    "Get available filter options (contexts, , note types) that the user has in their notes",
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
                            message:
                                "Failed to get filter options. Please try again.",
                        };
                    }
                },
            }),
            summarizeNotes: tool({
                description:
                    "Generate an AI-powered intelligent summary with key insights, themes, and action items from the provided notes. Uses advanced AI analysis to identify patterns and extract meaningful information.",
                parameters: z.object({
                    noteIds: z
                        .array(z.string())
                        .describe(
                            "Array of note IDs to summarize. Use this after filtering notes to get their IDs."
                        ),
                    includeMetadata: z
                        .boolean()
                        .optional()
                        .default(true)
                        .describe(
                            "Whether to include metadata like creation date and contexts in the summary"
                        ),
                }),
                execute: async (params) => {
                    try {
                        const result = await summarizeNotes(params);
                        return result;
                    } catch (error) {
                        return {
                            success: false,
                            summary: "",
                            noteCount: 0,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : "Unknown error occurred",
                            message:
                                "Failed to generate notes summary. Please try again.",
                        };
                    }
                },
            }),
        },
    });

    return result.toDataStreamResponse();
}
