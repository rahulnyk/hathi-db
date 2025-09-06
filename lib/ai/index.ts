import { AIService } from "./types";
import { GeminiAIService } from "./gemini";
import { AI_MODEL_CONFIG } from "./ai-config";

// Create the AI service with configuration
export const aiService: AIService = new GeminiAIService(AI_MODEL_CONFIG.GEMINI);

// Export the AI provider interface and types
export * from "./types";

// Current embedding model configuration.
export function getCurrentEmbeddingConfig() {
    return AI_MODEL_CONFIG.GEMINI.embedding;
}
