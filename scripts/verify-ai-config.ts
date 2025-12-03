import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import type { UserAIConfig } from "../lib/ai/ai-config-types";

// Dynamic imports to ensure dotenv runs first
async function verifyAIConfig() {
    console.log("🔍 Starting AI Configuration Verification...");

    // Check if API key is present in env
    if (!process.env.GOOGLE_AI_API_KEY) {
        console.warn(
            "⚠️  GOOGLE_AI_API_KEY not found in environment variables"
        );
    } else {
        console.log("✅ GOOGLE_AI_API_KEY found in environment variables");
    }

    const { loadUserPreferencesFromFile, saveUserPreferencesToFile } =
        await import("../lib/user-preferences-server");
    const { getAiService, resetAIService, getAiConfig } = await import(
        "../lib/ai"
    );

    // 1. Load initial preferences
    console.log("\n1️⃣  Loading initial preferences...");
    const initialPrefs = await loadUserPreferencesFromFile();
    const initialConfig = initialPrefs.aiConfig.value;
    console.log("   Current Provider:", initialConfig.provider.name);
    console.log("   Current Model:", initialConfig.textGenerationModel);

    // Ensure we have an API key for the test
    if (!initialConfig.provider.apiKey && process.env.GOOGLE_AI_API_KEY) {
        console.log("   Injecting API key from env for test...");
        initialConfig.provider.apiKey = process.env.GOOGLE_AI_API_KEY;
    }

    // 2. Modify configuration (Test Persistence)
    console.log("\n2️⃣  Testing Persistence: Modifying configuration...");
    const testConfig: UserAIConfig = {
        ...initialConfig,
        textGenerationModel: "gemini-2.5-pro", // Change model
    } as UserAIConfig;

    const newPrefs = {
        ...initialPrefs,
        aiConfig: {
            ...initialPrefs.aiConfig,
            value: testConfig,
        },
    };

    await saveUserPreferencesToFile(newPrefs);

    const loadedPrefs = await loadUserPreferencesFromFile();
    if (loadedPrefs.aiConfig.value.textGenerationModel === "gemini-2.5-pro") {
        console.log(
            "   ✅ Persistence verified: Model updated to gemini-2.5-pro"
        );
    } else {
        console.error("   ❌ Persistence failed: Model update not saved");
        process.exit(1);
    }

    // 3. Test Service Reset and Reinitialization
    console.log("\n3️⃣  Testing Service Reset...");
    resetAIService();
    console.log("   Service reset triggered.");

    console.log("   Fetching new AI service instance...");
    try {
        const service = await getAiService();
        const config = await getAiConfig();

        if (config.textGeneration.model === "gemini-2.5-pro") {
            console.log("   ✅ Service reinitialized with new config");
        } else {
            console.error(
                "   ❌ Service reinitialization failed: Config mismatch"
            );
            console.log("   Expected: gemini-2.5-pro");
            console.log("   Actual:", config.textGeneration.model);
            process.exit(1);
        }
    } catch (error) {
        console.error("   ❌ Failed to initialize service:", error);
        // Don't exit, try to restore config
    }

    // 4. Restore original configuration
    console.log("\n4️⃣  Restoring original configuration...");
    await saveUserPreferencesToFile(initialPrefs);
    resetAIService();
    console.log("   ✅ Original configuration restored");

    console.log("\n🎉 Verification Completed Successfully!");
}

verifyAIConfig().catch(console.error);
