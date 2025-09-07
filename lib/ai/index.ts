import { AIService } from "./types";
import { GeminiAIService } from "./gemini";
import { AI_CONFIG } from "./ai-config";

const provider = "GEMINI";

// Get the AI configuration for the specified provider
export const aiConfig = AI_CONFIG[provider];

// Singleton instance of the AI service
let aiServiceInstance: AIService | null = null;

/**
 * Returns a singleton instance of the AI service.
 * This prevents the service from being instantiated on the client-side.
 * @returns AIService instance
 */
export function getAiService(): AIService {
    if (!aiServiceInstance) {
        aiServiceInstance = new GeminiAIService(aiConfig);
    }
    return aiServiceInstance;
}

// Export the AI provider interface and types
export * from "./types";

// Current embedding model configuration.
export function getCurrentEmbeddingConfig() {
    return aiConfig.embedding;
}
