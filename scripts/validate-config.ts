#!/usr/bin/env tsx

/**
 * Configuration validation script
 * Run this to verify your AI model configuration is set up correctly
 */

import { getAIConfig, getEmbeddingConfig } from "../lib/ai/ai-config.js";

function validateConfiguration() {
    console.log("🔍 AI Configuration Validation\n");

    // Validate AI Provider Configuration
    console.log("📝 LLM Configuration:");
    const aiProvider = process.env.AI_PROVIDER || "GEMINI";
    const aiConfig = getAIConfig()[aiProvider];

    if (!aiConfig) {
        console.error(`❌ Invalid AI_PROVIDER: ${aiProvider}`);
        process.exit(1);
    }

    console.log(`   Provider: ${aiProvider}`);
    console.log(`   Text Generation Model: ${aiConfig.textGeneration.model}`);
    console.log(
        `   Text Generation Lite Model: ${aiConfig.textGenerationLite.model}`
    );
    console.log(`   Agent Model: ${aiConfig.agentModel.model}`);
    console.log(
        `   API Key Present: ${aiConfig.provider.apiKey ? "✅ Yes" : "❌ No"}`
    );

    // Validate Embedding Provider Configuration
    console.log("\n🔗 Embedding Configuration:");
    const embeddingProvider = process.env.EMBEDDING_PROVIDER || "HUGGINGFACE";
    const embeddingConfig = getEmbeddingConfig()[embeddingProvider];

    if (!embeddingConfig) {
        console.error(`❌ Invalid EMBEDDING_PROVIDER: ${embeddingProvider}`);
        process.exit(1);
    }

    console.log(`   Provider: ${embeddingProvider}`);
    console.log(`   Model: ${embeddingConfig.embedding.model}`);
    console.log(`   Dimensions: ${embeddingConfig.embedding.dimensions}`);
    console.log(
        `   Environment EMBEDDINGS_DIMS: ${
            process.env.EMBEDDINGS_DIMS || "768 (default)"
        }`
    );

    // Check dimension consistency
    const envDims = parseInt(process.env.EMBEDDINGS_DIMS || "768", 10);
    if (embeddingConfig.embedding.dimensions !== envDims) {
        console.warn(
            `⚠️  Warning: EMBEDDINGS_DIMS (${envDims}) doesn't match embedding model dimensions (${embeddingConfig.embedding.dimensions})`
        );
    }

    // Validate model environment variables
    console.log("\n🎛️  Model Configuration:");
    const modelVars = [
        "GEMINI_TEXT_GENERATION_MODEL",
        "GEMINI_TEXT_GENERATION_LITE_MODEL",
        "GEMINI_AGENT_MODEL",
        "GEMINI_EMBEDDING_MODEL",
        "HUGGINGFACE_EMBEDDING_MODEL",
    ];

    modelVars.forEach((varName) => {
        const value = process.env[varName];
        console.log(`   ${varName}: ${value || "default"}`);
    });

    console.log("\n✅ Configuration validation completed!");
    console.log(
        "\n💡 To customize models, set environment variables in your .env.local file:"
    );
    console.log("   Example: GEMINI_TEXT_GENERATION_MODEL=gemini-1.5-pro");
}

if (import.meta.url === `file://${process.argv[1]}`) {
    validateConfiguration();
}

export { validateConfiguration };
