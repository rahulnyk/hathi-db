/**
 * AI Model Configuration
 *
 * Separate configurations for LLM (text generation) and embedding services.
 */

import { AIConfig, EmbeddingConfig } from "./types";

export function getAIConfig(): Record<string, AIConfig> {
    return {
        GEMINI: {
            textGeneration: {
                model: process.env.GEMINI_TEXT_GENERATION_MODEL || "gemini-2.5-flash",
            },
            textGenerationLite: {
                model: process.env.GEMINI_TEXT_GENERATION_LITE_MODEL || "gemini-2.0-flash-lite",
            },
            agentModel: {
                model: process.env.GEMINI_AGENT_MODEL || "gemini-2.5-flash",
            },
            provider: {
                name: "Google",
                apiKey: process.env.GOOGLE_AI_API_KEY,
                baseURL: process.env.GOOGLE_AI_BASE_URL,
            },
        },
    } as const;
}

export function getEmbeddingConfig(): Record<string, EmbeddingConfig> {
    return {
        GEMINI: {
            embedding: {
                model: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-exp-03-07",
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
                model: process.env.HUGGINGFACE_EMBEDDING_MODEL || "intfloat/multilingual-e5-base",
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

// Backward compatibility proxy
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

export const EMBEDDING_CONFIG = new Proxy(
    {} as Record<string, EmbeddingConfig>,
    {
        get(_, prop: string) {
            return getEmbeddingConfig()[prop];
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ownKeys(_) {
            return Object.keys(getEmbeddingConfig());
        },
        has(_, prop: string) {
            return prop in getEmbeddingConfig();
        },
    }
);
