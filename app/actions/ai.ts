"use server";

import { fetchContextStats } from "./notes";
import { aiProvider } from "@/lib/ai";
import { measureExecutionTime } from "@/lib/performance";

/**
 * Generates context suggestions for a note using AI
 *
 * @param content - The content of the note
 * @returns Promise that resolves to an array of suggested contexts
 */
export async function suggestContexts({
    content,
}: {
    content: string;
}): Promise<string[]> {
    return measureExecutionTime("suggestContexts", async () => {
        try {
            // Fetch user's existing contexts
            const contextStats = await fetchContextStats();
            const userContexts = contextStats.map((stat) => stat.context);

            // Generate suggestions using AI
            const response = await aiProvider.suggestContexts({
                content,
                userContexts,
            });

            return response.suggestions;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error(
                "Error generating context suggestions:",
                errorMessage
            );
            throw new Error(
                `Failed to generate context suggestions: ${errorMessage}`
            );
        }
    });
}

/**
 * Structurizes a note using AI to organize and format the content
 *
 * @param content - The content of the note to structurize
 * @returns Promise that resolves to the structured content
 */
export async function structurizeNote({
    content,
}: {
    content: string;
}): Promise<string> {
    return measureExecutionTime("structurizeNote", async () => {
        try {
            // Fetch user's existing contexts for better structuring
            const contextStats = await fetchContextStats();
            const userContexts = contextStats.map((stat) => stat.context);

            // Generate structured content using AI
            const response = await aiProvider.structurizeNote({
                content,
                userContexts,
            });

            return response.structuredContent;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error structurizing note:", errorMessage);
            throw new Error(`Failed to structurize note: ${errorMessage}`);
        }
    });
}

/**
 * Generates embeddings for a note (for future use)
 *
 * @param content - The content of the note
 * @returns Promise that resolves to the embedding vector
 */
export async function generateEmbedding({
    content,
}: {
    content: string;
}): Promise<number[]> {
    return measureExecutionTime("generateEmbedding", async () => {
        try {
            const response = await aiProvider.generateEmbedding({ content });
            return response.embedding;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error generating embedding:", errorMessage);
            throw new Error(`Failed to generate embedding: ${errorMessage}`);
        }
    });
}
