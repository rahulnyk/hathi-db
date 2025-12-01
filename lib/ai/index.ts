/**
 * AI Service Factory
 *
 * Server-side only module that provides singleton instances of AI services.
 */

import { AIService, EmbeddingService } from "./types";
import { GeminiAIService } from "./gemini";
import { GeminiEmbeddingService } from "./gemini-embedding";
import { HuggingFaceEmbeddingService } from "./huggingface-embedding";
import { getAIConfig, getEmbeddingConfig } from "./ai-config";

const aiProvider = process.env.AI_PROVIDER || "GEMINI";
const embeddingProvider = process.env.EMBEDDING_PROVIDER || "HUGGINGFACE";

let aiServiceInstance: AIService | null = null;
let embeddingServiceInstance: EmbeddingService | null = null;

export function getAiService(): AIService {
    if (!aiServiceInstance) {
        console.log(`🔧 Using ${aiProvider} for text generation`);
        const config = getAIConfig()[aiProvider];

        if (aiProvider === "GEMINI") {
            aiServiceInstance = new GeminiAIService(config);
        } else {
            throw new Error(`Unsupported AI provider: ${aiProvider}`);
        }
    }
    return aiServiceInstance;
}

export function getEmbeddingService(): EmbeddingService {
    if (!embeddingServiceInstance) {
        const config = getEmbeddingConfig()[embeddingProvider];

        if (embeddingProvider === "HUGGINGFACE") {
            console.log("🔧 Using Hugging Face Local Embedding Service");
            embeddingServiceInstance = new HuggingFaceEmbeddingService(config);
        } else {
            console.log("🔧 Using Gemini Embedding Service");
            embeddingServiceInstance = new GeminiEmbeddingService(config);
        }
    }
    return embeddingServiceInstance;
}

/**
 * Get the current AI configuration
 * Useful for accessing model names and other config without importing the service
 */
export function getAiConfig() {
    return getAIConfig()[aiProvider];
}

export * from "./types";
