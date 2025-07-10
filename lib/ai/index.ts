import { AIProvider } from "./types";
import { GeminiAI } from "./gemini";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Export the AI provider interface and types
export * from "./types";

// Create and export the default AI provider based on configuration
function createAIProvider(): AIProvider {
    return new GeminiAI(process.env.GOOGLE_AI_API_KEY!);
}

export const aiProvider: AIProvider = createAIProvider();

export const gemini = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_AI_API_KEY,
});
