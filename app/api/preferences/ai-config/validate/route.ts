import { NextResponse } from "next/server";
import { UserAIConfig } from "@/lib/ai/ai-config-types";
import { GeminiAIService } from "@/lib/ai/gemini";
import { AIConfig, AIService } from "@/lib/ai/types";

/**
 * POST /api/preferences/ai-config/validate
 * Validate AI configuration by testing connection and models
 */
export async function POST(request: Request) {
    try {
        const config = (await request.json()) as UserAIConfig;

        // Validate required fields
        if (!config.provider.apiKey) {
            return NextResponse.json(
                { valid: false, error: "API key is required" },
                { status: 400 }
            );
        }

        // Convert UserAIConfig to AIConfig format
        const aiConfig: AIConfig = {
            textGeneration: { model: config.textGenerationModel },
            textGenerationLite: { model: config.textGenerationLiteModel },
            agentModel: { model: config.agentModel },
            provider: config.provider,
        };

        // Attempt to instantiate and test the service based on provider
        try {
            let testService: AIService;

            switch (config.provider.name) {
                case "Google":
                    testService = new GeminiAIService(aiConfig);
                    break;
                case "OpenAI":
                    return NextResponse.json({
                        valid: false,
                        error: "OpenAI provider is not yet implemented",
                    });
                case "Anthropic":
                    return NextResponse.json({
                        valid: false,
                        error: "Anthropic provider is not yet implemented",
                    });
                default:
                    return NextResponse.json({
                        valid: false,
                        error: `Unsupported provider: ${(config as any).provider?.name}`,
                    });
            }

            // Test with a simple request
            await testService.suggestContexts({
                content: "test",
                userContexts: [],
            });

            // If we get here, the configuration is valid
            return NextResponse.json({
                valid: true,
                message: "Configuration validated successfully",
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            // Classify the error
            if (
                errorMessage.includes("API key") ||
                errorMessage.includes("401") ||
                errorMessage.includes("403")
            ) {
                return NextResponse.json({
                    valid: false,
                    error: "Invalid API key or authentication failed",
                });
            } else if (errorMessage.includes("model")) {
                return NextResponse.json({
                    valid: false,
                    error: "Invalid model configuration",
                });
            } else {
                return NextResponse.json({
                    valid: false,
                    error: `Validation failed: ${errorMessage}`,
                });
            }
        }
    } catch (error) {
        console.error("Error validating AI config:", error);
        return NextResponse.json(
            { valid: false, error: "Failed to validate configuration" },
            { status: 500 }
        );
    }
}
