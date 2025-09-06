import { AIProvider } from "./types";
import { GeminiAI } from "./gemini";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Export the AI provider interface and types
export * from "./types";

// Create a shared Google AI provider instance
export const gemini = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_AI_API_KEY,
});

// Create the AI provider using the shared Google AI instance
export const aiProvider: AIProvider = new GeminiAI(gemini);
