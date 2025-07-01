"use server";

import { aiProvider } from "@/lib/ai";
import { measureExecutionTime } from "@/lib/performance";

/**
 * Generates context suggestions for a note based on its content and user's existing contexts
 *
 * @param content - The content of the note
 * @param userContexts - Array of existing user contexts
 * @returns Promise that resolves to an array of suggested contexts
 */
export async function suggestContexts({
    content,
    userContexts,
}: {
    content: string;
    userContexts: string[];
}): Promise<string[]> {
    return measureExecutionTime("suggestContexts", async () => {
        try {
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
            console.error("Error generating context suggestions:", errorMessage);
            throw new Error(
                `Failed to generate context suggestions: ${errorMessage}`
            );
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
}): Promise<string> {
    return measureExecutionTime("structurizeNote", async () => {
        try {
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
}): Promise<number[]> {
    return measureExecutionTime("generateDocumentEmbedding", async () => {
        try {
            const response = await aiProvider.generateDocumentEmbedding({
                content,
                contexts,
                tags,
                noteType,
            });
            return response.embedding;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error generating document embedding:", errorMessage);
            throw new Error(`Failed to generate document embedding: ${errorMessage}`);
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
}): Promise<number[]> {
    return measureExecutionTime("generateQueryEmbedding", async () => {
        try {
            const response = await aiProvider.generateQueryEmbedding({
                question,
            });
            return response.embedding;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            console.error("Error generating query embedding:", errorMessage);
            throw new Error(`Failed to generate query embedding: ${errorMessage}`);
        }
    });
}
