import { AIProvider } from "./types";
import { GeminiProvider } from "./gemini";

// Export the AI provider interface and types
export * from "./types";

// Create and export the default AI provider based on configuration
function createAIProvider(): AIProvider {
    return new GeminiProvider();
}

export const aiProvider: AIProvider = createAIProvider();
