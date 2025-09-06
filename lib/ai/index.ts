import { AIService } from "./types";
import { GeminiAIService } from "./gemini";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Export the AI provider interface and types
export * from "./types";

// Create the AI service using Google AI
const googleProvider = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_AI_API_KEY,
});

export const aiService: AIService = new GeminiAIService(googleProvider);
