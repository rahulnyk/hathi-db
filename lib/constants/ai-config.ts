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
 * Embedding model configuration
 */
export const EMBEDDING_CONFIG = {
    // Google embedding-001: 768 dimensions
    GEMINI: {
        model: 'embedding-001',
        dimensions: 768
    }
} as const;

/**
 * Get current embedding configuration based on AI provider
 */
export function getCurrentEmbeddingConfig() {
    return EMBEDDING_CONFIG.GEMINI;
}
