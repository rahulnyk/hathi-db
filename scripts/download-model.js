#!/usr/bin/env node

/**
 * HuggingFace Embedding Model Download Script
 *
 * This script downloads and caches the HuggingFace embedding model
 * specified in the environment variables.
 *
 * Usage:
 *   node scripts/download-model.js
 *
 * Environment Variables:
 *   HUGGINGFACE_EMBEDDING_MODEL - The model name to download (default: intfloat/multilingual-e5-base)
 */

const { pipeline } = require("@huggingface/transformers");
const path = require("path");

async function downloadModel() {
    try {
        const modelName =
            process.env.HUGGINGFACE_EMBEDDING_MODEL ||
            "intfloat/multilingual-e5-base";
        const cacheDir = path.resolve("./.cache/huggingface");

        console.log(`🤖 Downloading embedding model: ${modelName}`);
        console.log(
            "📥 This process may take several minutes for the first download..."
        );
        console.log(`📂 Cache directory: ${cacheDir}`);

        const startTime = Date.now();

        // Download and initialize the model
        const featurePipeline = await pipeline(
            "feature-extraction",
            modelName,
            {
                device: "cpu",
                dtype: "fp32",
                revision: "main",
                cache_dir: cacheDir,
                local_files_only: false,
            }
        );

        const duration = Math.round((Date.now() - startTime) / 1000);
        console.log(
            `✅ Successfully downloaded embedding model: ${modelName} (${duration}s)`
        );
        console.log("🎉 Model is now cached and ready for use!");

        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to download embedding model:", error.message);

        // Provide helpful error context
        if (
            error.message.includes("ENOTFOUND") ||
            error.message.includes("network")
        ) {
            console.error(
                "💡 This appears to be a network connectivity issue."
            );
            console.error(
                "   Please check your internet connection and try again."
            );
        } else if (
            error.message.includes("model") &&
            error.message.includes("not found")
        ) {
            console.error("💡 The specified model was not found.");
            console.error(
                "   Please check the HUGGINGFACE_EMBEDDING_MODEL environment variable."
            );
        } else {
            console.error(
                "💡 For debugging, you can run this script directly:"
            );
            console.error("   node scripts/download-model.js");
        }

        process.exit(1);
    }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
    console.log("\n🛑 Download interrupted by user");
    process.exit(130);
});

process.on("SIGTERM", () => {
    console.log("\n🛑 Download terminated");
    process.exit(143);
});

// Run the download
downloadModel();
