/**
 * AI Model Configuration
 */

import { AIConfig } from "./types";

export const AI_CONFIG: Record<string, AIConfig> = {
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
            baseURL: process.env.GOOGLE_AI_BASE_URL || null,
        },
    },
} as const;
