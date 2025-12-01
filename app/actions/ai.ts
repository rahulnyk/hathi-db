"use server";

import { getAiService, getEmbeddingService } from "@/lib/ai";
import { measureExecutionTime } from "@/lib/performance";
import { AIError, ServerActionResult } from "@/lib/ai/types";

/**
 * Generates context suggestions for a note based on its content and user's existing contexts
 *
 * @param content - The content of the note
 * @param userContexts - Array of existing user contexts
 * @returns Promise that resolves to an array of suggested contexts
 */

const aiService = getAiService();
const embeddingService = getEmbeddingService();

export async function suggestContexts({
    content,
    userContexts,
}: {
    content: string;
    userContexts: string[];
}): Promise<ServerActionResult<string[]>> {
    return measureExecutionTime("suggestContexts", async () => {
        try {
            const { suggestions } = await aiService.suggestContexts({
                content,
                userContexts,
            });

            return { success: true, data: suggestions };
        } catch (error) {
            // If it's an AIError with a userMessage, use that
            if (error instanceof AIError) {
                console.error("Error suggesting contexts:", error.message);
                return {
                    success: false,
                    error: error.userMessage || error.message,
                    errorDetails: error.toErrorDetails(),
                };
            }

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error suggesting contexts:", errorMessage);
            return {
                success: false,
                error: `Failed to suggest contexts: ${errorMessage}`,
            };
        }
    });
}

/**
 * Extracts a deadline from note content using AI.
 *
 * @param content - The content of the note
 * @returns Promise that resolves to a string (YYYY-MM-DD) or null
 */
export async function extractDeadlineFromContent({
    content,
}: {
    content: string;
}): Promise<string | null> {
    return measureExecutionTime("extractDeadlineFromContent", async () => {
        try {
            const { deadline } = await aiService.extractDeadline({
                content,
            });
            return deadline;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error extracting deadline:", errorMessage);
            // For this specific use case, we don't want to throw an error
            // that stops note creation. Just return null if AI fails.
            return null;
        }
    });
}

/**
 * Structurizes a note's content using AI
 *
 * @param content - The content to structurize
 * @param userContexts - Array of existing user contexts
 * @returns Promise that resolves to the structurized content
 */
export async function structurizeNote({
    content,
    userContexts,
}: {
    content: string;
    userContexts: string[];
}): Promise<ServerActionResult<string>> {
    return measureExecutionTime("structurizeNote", async () => {
        try {
            const { structuredContent } = await aiService.structurizeNote({
                content,
                userContexts,
            });
            return { success: true, data: structuredContent };
        } catch (error: unknown) {
            // If it's an AIError with a userMessage, use that
            if (error instanceof AIError) {
                console.error("Error structurizing note:", error.message);
                return {
                    success: false,
                    error: error.userMessage || error.message,
                    errorDetails: error.toErrorDetails(),
                };
            }

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error structurizing note:", errorMessage);
            return {
                success: false,
                error: `Failed to structurize note: ${errorMessage}`,
            };
        }
    });
}

/**
 * Generates optimized document embeddings for notes (for retrieval)
 *
 * @param content - The content of the note
 * @param contexts - Optional array of contexts
 * @param tags - Optional array of tags
 * @param noteType - Optional note type
 * @returns Promise that resolves to the embedding vector
 */
export async function generateDocumentEmbedding({
    content,
    contexts,
    tags,
    noteType,
}: {
    content: string;
    contexts?: string[];
    tags?: string[];
    noteType?: string;
}): Promise<ServerActionResult<{ embedding: number[]; model: string }>> {
    return measureExecutionTime("generateDocumentEmbedding", async () => {
        try {
            const response = await embeddingService.generateDocumentEmbedding({
                content,
                contexts,
                tags,
                noteType,
            });
            return {
                success: true,
                data: {
                    embedding: response.embedding,
                    model: response.model,
                },
            };
        } catch (error: unknown) {
            // If it's an AIError with a userMessage, use that
            if (error instanceof AIError) {
                console.error("Error generating document embedding:", error.message);
                return {
                    success: false,
                    error: error.userMessage || error.message,
                    errorDetails: error.toErrorDetails(),
                };
            }

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error generating document embedding:", errorMessage);
            return {
                success: false,
                error: `Failed to generate document embedding: ${errorMessage}`,
            };
        }
    });
}

/**
 * Generates optimized query embeddings for questions (for finding relevant documents)
 *
 * @param question - The question to embed
 * @returns Promise that resolves to the embedding vector
 */
export async function generateQueryEmbedding({
    question,
}: {
    question: string;
}): Promise<ServerActionResult<number[]>> {
    return measureExecutionTime("generateQueryEmbedding", async () => {
        try {
            const response = await embeddingService.generateQueryEmbedding({
                question,
            });
            return { success: true, data: response.embedding };
        } catch (error: unknown) {
            // If it's an AIError with a userMessage, use that
            if (error instanceof AIError) {
                console.error("Error generating query embedding:", error.message);
                return {
                    success: false,
                    error: error.userMessage || error.message,
                    errorDetails: error.toErrorDetails(),
                };
            }

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error generating query embedding:", errorMessage);
            return {
                success: false,
                error: `Failed to generate query embedding: ${errorMessage}`,
            };
        }
    });
}
