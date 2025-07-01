import { AIProvider } from "./types";
import { OpenAIProvider } from "./openai";
import { GeminiProvider } from "./gemini";
import { CURRENT_AI_PROVIDER, AI_PROVIDER } from "../constants/ai-config";

// Export the AI provider interface and types
export * from "./types";

// Create and export the default AI provider based on configuration
function createAIProvider(): AIProvider {
    switch (CURRENT_AI_PROVIDER) {
        case AI_PROVIDER.OPENAI:
            return new OpenAIProvider();
        case AI_PROVIDER.GEMINI:
            return new GeminiProvider();
        default:
            return new GeminiProvider();
    }
}

export const aiProvider: AIProvider = createAIProvider();
