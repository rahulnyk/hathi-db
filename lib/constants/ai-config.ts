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
    GEMINI: 'gemini',
    OPENAI: 'openai'
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
    // OpenAI text-embedding-3-small: 1536 dimensions
    OPENAI: {
        model: 'text-embedding-3-small',
        dimensions: 1536
    },
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
    switch (CURRENT_AI_PROVIDER) {
        case AI_PROVIDER.OPENAI:
            return EMBEDDING_CONFIG.OPENAI;
        case AI_PROVIDER.GEMINI:
            return EMBEDDING_CONFIG.GEMINI;
        default:
            return EMBEDDING_CONFIG.GEMINI;
    }
}
