"use server";

import { fetchContextStats } from "./notes";
import { aiProvider } from "@/lib/ai";

/**
 * Generates context suggestions for a note using AI
 *
 * @param noteId - The ID of the note to generate suggestions for
 * @param content - The content of the note
 * @returns Promise that resolves to an array of suggested contexts
 */
export async function suggestContexts({
    noteId,
    content,
}: {
    noteId: string;
    content: string;
}): Promise<string[]> {
    try {
        // Fetch user's existing contexts
        const contextStats = await fetchContextStats();
        const userContexts = contextStats.map(stat => stat.context);

        // Generate suggestions using AI
        const response = await aiProvider.suggestContexts({
            content,
            userContexts,
        });

        return response.suggestions;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error generating context suggestions:", errorMessage);
        throw new Error(`Failed to generate context suggestions: ${errorMessage}`);
    }
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
    try {
        const response = await aiProvider.generateEmbedding({ content });
        return response.embedding;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error generating embedding:", errorMessage);
        throw new Error(`Failed to generate embedding: ${errorMessage}`);
    }
}
