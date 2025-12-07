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
import { getPreferencesLastModified } from "@/lib/user-preferences-server";

const embeddingProvider = process.env.EMBEDDING_PROVIDER || "HUGGINGFACE";

let aiServiceInstance: AIService | null = null;
let embeddingServiceInstance: EmbeddingService | null = null;
let lastConfigLoadTime = 0;

export async function getAiService(): Promise<AIService> {
    const currentModTime = getPreferencesLastModified();
    
    // Check if configuration file has changed
    if (aiServiceInstance && currentModTime > lastConfigLoadTime) {
        console.log("🔄 Configuration changed (detected fs change), reloading AI service");
        aiServiceInstance = null;
    }

    if (!aiServiceInstance) {
        const config = await getAIConfig();
        lastConfigLoadTime = currentModTime;
        console.log(`🔧 Using ${config.provider.name} for text generation`);

        if (config.provider.name === "Google") {
            aiServiceInstance = new GeminiAIService(config);
        } else {
            throw new Error(`Unsupported AI provider: ${config.provider.name}`);
        }
    }
    return aiServiceInstance;
}

// getEmbeddingService remains synchronous - embeddings stay local
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
 * Reset AI service instance (called when configuration changes)
 * Embedding service is not reset as it remains local
 */
export function resetAIService(): void {
    console.log("🔄 Resetting AI service instance");
    aiServiceInstance = null;
}

/**
 * Get the current AI configuration
 * Useful for accessing model names and other config without importing the service
 */
export async function getAiConfig() {
    const config = await getAIConfig();
    return config;
}

export * from "./types";
