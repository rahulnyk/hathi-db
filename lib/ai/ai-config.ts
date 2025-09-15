/**
 * AI Model Configuration
 */

import { AIConfig } from "./types";

// Function to get AI config (lazy evaluation)
export function getAIConfig(): Record<string, AIConfig> {
    return {
        // Google Gemini models
        GEMINI: {
            // Text generation model
            textGeneration: {
                model: "gemini-2.5-flash",
            },
            // Lite model for smaller tasks like date extraction
            textGenerationLite: {
                model: "gemini-2.0-flash-lite",
            },
            agentModel: {
                model: "gemini-2.5-flash",
            },
            // Embedding model - gemini-embedding-exp-03-07 produces 1536 dimensions
            embedding: {
                model: "gemini-embedding-exp-03-07",
                dimensions: 1536,
            },
            // Provider configuration
            provider: {
                name: "Google",
                apiKey: process.env.GOOGLE_AI_API_KEY,
                baseURL: process.env.GOOGLE_AI_BASE_URL,
            },
        },
    } as const;
}

// For backward compatibility, export AI_CONFIG but with lazy evaluation
// This ensures existing imports continue to work while fixing the environment variable issue
export const AI_CONFIG = new Proxy({} as Record<string, AIConfig>, {
    get(_, prop: string) {
        return getAIConfig()[prop];
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ownKeys(_) {
        return Object.keys(getAIConfig());
    },
    has(_, prop: string) {
        return prop in getAIConfig();
    },
});
