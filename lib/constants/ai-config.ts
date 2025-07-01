/**
 * AI Configuration Constants
 *
 * Toggle AI features on/off with minimal code changes
 */

/**
 * Enable or disable AI-generated answers for Q&A
 *
 * When true: Questions get AI-generated answers based on semantic search results
 * When false: Questions show the retrieved notes directly via source notes list
 */
export const AI_ANSWERS_ENABLED = true;

/**
 * AI Provider Configuration
 *
 * Choose which AI provider to use for the application
 */
export const AI_PROVIDER = {
    GEMINI: 'gemini'
} as const;

export type AIProviderType = typeof AI_PROVIDER[keyof typeof AI_PROVIDER];

/**
 * Current AI provider - change this to switch between providers
 */
export const CURRENT_AI_PROVIDER: AIProviderType = AI_PROVIDER.GEMINI;

/**
 * AI Model Configuration
 */
export const AI_MODEL_CONFIG = {
    // Google Gemini models
    GEMINI: {
        // Text generation model
        textGeneration: {
            model: 'gemini-2.0-flash'
        },
        // Embedding model - gemini-embedding-exp-03-07 produces 1536 dimensions
        embedding: {
            model: 'gemini-embedding-exp-03-07',
            dimensions: 1536
        }
    }
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
