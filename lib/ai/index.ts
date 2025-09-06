import { AIService } from "./types";
import { GeminiAIService } from "./gemini";
import { AI_CONFIG } from "./ai-config";

const provider = "GEMINI";

// Get the AI configuration for the specified provider
export const aiConfig = AI_CONFIG[provider];

// Create the AI service with configuration
export const aiService: AIService = new GeminiAIService(aiConfig);

// Export the AI provider interface and types
export * from "./types";

// Current embedding model configuration.
export function getCurrentEmbeddingConfig() {
    return aiConfig.embedding;
}
