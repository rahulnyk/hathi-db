import { NextResponse } from "next/server";
import {
    loadUserPreferencesFromFile,
    saveUserPreferencesToFile,
} from "@/lib/user-preferences-server";
import {
    UserAIConfig,
    AI_PROVIDERS,
    getModelsForProvider,
    AIProviderName,
    TextGenerationModel,
} from "@/lib/ai/ai-config-types";
import { resetAIService } from "@/lib/ai";

/**
 * GET /api/preferences/ai-config
 * Retrieve current AI configuration
 */
export async function GET() {
    try {
        const preferences = await loadUserPreferencesFromFile();
        return NextResponse.json(preferences.aiConfig.value);
    } catch (error) {
        console.error("Error loading AI config:", error);
        return NextResponse.json(
            { error: "Failed to load AI configuration" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/preferences/ai-config
 * Update AI configuration and reset services
 */
export async function POST(request: Request) {
    try {
        const newConfig = (await request.json()) as UserAIConfig;

        // Validate configuration
        if (!newConfig.provider.apiKey) {
            return NextResponse.json(
                { error: "API key is required" },
                { status: 400 }
            );
        }

        // Validate provider name
        if (!AI_PROVIDERS.includes(newConfig.provider.name as AIProviderName)) {
            return NextResponse.json(
                { error: `Invalid provider: ${newConfig.provider.name}` },
                { status: 400 }
            );
        }

        // Validate models match the selected provider
        const validModels = getModelsForProvider(newConfig.provider.name);
        if (
            !validModels.includes(
                newConfig.textGenerationModel as TextGenerationModel
            )
        ) {
            return NextResponse.json(
                {
                    error: `Invalid textGenerationModel '${newConfig.textGenerationModel}' for provider '${newConfig.provider.name}'`,
                },
                { status: 400 }
            );
        }

        if (
            !validModels.includes(
                newConfig.textGenerationLiteModel as TextGenerationModel
            )
        ) {
            return NextResponse.json(
                {
                    error: `Invalid textGenerationLiteModel '${newConfig.textGenerationLiteModel}' for provider '${newConfig.provider.name}'`,
                },
                { status: 400 }
            );
        }

        if (
            !validModels.includes(newConfig.agentModel as TextGenerationModel)
        ) {
            return NextResponse.json(
                {
                    error: `Invalid agentModel '${newConfig.agentModel}' for provider '${newConfig.provider.name}'`,
                },
                { status: 400 }
            );
        }

        // Validate baseURL format if provided
        if (newConfig.provider.baseURL) {
            try {
                new URL(newConfig.provider.baseURL);
            } catch {
                return NextResponse.json(
                    { error: "Invalid baseURL format. Must be a valid URL." },
                    { status: 400 }
                );
            }
        }

        // Load current preferences
        const preferences = await loadUserPreferencesFromFile();

        // Update AI config
        preferences.aiConfig.value = newConfig;

        // Save to file
        await saveUserPreferencesToFile(preferences);

        // Reset AI service singleton to use new config
        resetAIService();

        console.log("✅ AI configuration updated successfully");
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving AI config:", error);
        return NextResponse.json(
            { error: "Failed to save AI configuration" },
            { status: 500 }
        );
    }
}
