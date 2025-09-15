import { AIService, EmbeddingService } from "./types";
import { GeminiAIService } from "./gemini";
import { GeminiEmbeddingService } from "./gemini-embedding";
import { AI_CONFIG } from "./ai-config";

const provider = "GEMINI";

// Get the AI configuration for the specified provider (now with lazy evaluation)
export const aiConfig = AI_CONFIG[provider];

// Singleton instance of the AI service
let aiServiceInstance: AIService | null = null;
let embeddingServiceInstance: EmbeddingService | null = null;

/**
 * Returns a singleton instance of the AI service.
 * This prevents the service from being instantiated on the client-side.
 * @returns AIService instance
 */
export function getAiService(): AIService {
    if (!aiServiceInstance) {
        aiServiceInstance = new GeminiAIService(AI_CONFIG[provider]);
    }
    return aiServiceInstance;
}

/**
 * Returns a singleton instance of the Embedding service.
 * @returns EmbeddingService instance
 */
export function getEmbeddingService(): EmbeddingService {
    if (!embeddingServiceInstance) {
        embeddingServiceInstance = new GeminiEmbeddingService(
            AI_CONFIG[provider]
        );
    }
    return embeddingServiceInstance;
}

// Export the AI provider interface and types
export * from "./types";
