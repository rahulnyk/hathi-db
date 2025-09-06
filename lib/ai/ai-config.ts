/**
 * AI Model Configuration
 */
export const AI_MODEL_CONFIG = {
    // Google Gemini models
    GEMINI: {
        // Text generation model
        textGeneration: {
            model: "gemini-2.5-flash",
        },
        textGenerationLite: {
            model: "gemini-2.0-flash-lite",
        },
        // Embedding model - gemini-embedding-exp-03-07 produces 1536 dimensions
        embedding: {
            model: "gemini-embedding-exp-03-07",
            dimensions: 1536,
        },
    },
} as const;

/**
 * Get current text generation model configuration
 */
export function getCurrentTextGenerationConfig() {
    return AI_MODEL_CONFIG.GEMINI.textGeneration;
}

export function getCurrentEmbeddingConfig() {
    return AI_MODEL_CONFIG.GEMINI.embedding;
}
