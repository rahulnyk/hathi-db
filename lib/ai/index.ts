import { AIService, EmbeddingService } from "./types";
import { GeminiAIService } from "./gemini";
import { GeminiEmbeddingService } from "./gemini-embedding";
import { HuggingFaceEmbeddingService } from "./huggingface-embedding";
import { AI_CONFIG, EMBEDDING_CONFIG } from "./ai-config";

const aiProvider = process.env.AI_PROVIDER || "GEMINI";
const embeddingProvider = process.env.EMBEDDING_PROVIDER || "HUGGINGFACE";

export const aiConfig = AI_CONFIG[aiProvider];

let aiServiceInstance: AIService | null = null;
let embeddingServiceInstance: EmbeddingService | null = null;

export function getAiService(): AIService {
    if (!aiServiceInstance) {
        console.log(`🔧 Using ${aiProvider} for text generation`);
        aiServiceInstance = new GeminiAIService(AI_CONFIG[aiProvider]);
    }
    return aiServiceInstance;
}

export function getEmbeddingService(): EmbeddingService {
    if (!embeddingServiceInstance) {
        if (embeddingProvider === "HUGGINGFACE") {
            console.log("🔧 Using Hugging Face Local Embedding Service");
            embeddingServiceInstance = new HuggingFaceEmbeddingService(
                EMBEDDING_CONFIG[embeddingProvider]
            );
        } else {
            console.log("🔧 Using Gemini Embedding Service");
            embeddingServiceInstance = new GeminiEmbeddingService(
                EMBEDDING_CONFIG[embeddingProvider]
            );
        }
    }
    return embeddingServiceInstance;
}

export * from "./types";
