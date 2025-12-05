/**
 * AI Model Configuration
 *
 * Server-side only configuration for LLM (text generation) and embedding services.
 * LLM configuration is loaded from user preferences.
 * Embedding configuration remains environment-based.
 */

import { AIConfig, EmbeddingConfig } from "./types";
import { loadUserPreferencesFromFile } from "@/lib/user-preferences-server";

/**
 * Load AI configuration from user preferences
 * Falls back to environment variables if preferences not available
 */
export async function getAIConfig(): Promise<AIConfig> {
    const preferences = await loadUserPreferencesFromFile();
    const userAIConfig = preferences.aiConfig.value;

    return {
        textGeneration: {
            model: userAIConfig.textGenerationModel,
        },
        textGenerationLite: {
            model: userAIConfig.textGenerationLiteModel,
        },
        agentModel: {
            model: userAIConfig.agentModel,
        },
        provider: userAIConfig.provider,
    };
}

// getEmbeddingConfig remains unchanged - embeddings stay local
export function getEmbeddingConfig(): Record<string, EmbeddingConfig> {
    return {
        GEMINI: {
            embedding: {
                model:
                    process.env.GEMINI_EMBEDDING_MODEL ||
                    "gemini-embedding-exp-03-07",
                dimensions: 1536,
            },
            provider: {
                name: "Google",
                apiKey: process.env.GOOGLE_AI_API_KEY,
                baseURL: process.env.GOOGLE_AI_BASE_URL,
            },
        },
        HUGGINGFACE: {
            embedding: {
                model:
                    process.env.HUGGINGFACE_EMBEDDING_MODEL ||
                    "intfloat/multilingual-e5-base",
                dimensions: 768,
            },
            provider: {
                name: "Hugging Face",
                apiKey: undefined,
                baseURL: undefined,
            },
        },
    } as const;
}
