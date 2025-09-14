import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, LanguageModel } from "ai";
import {
    AIService,
    AIConfig,
    SuggestContextsRequest,
    SuggestContextsResponse,
    StructurizeNoteRequest,
    StructurizeNoteResponse,
    AIError,
    ExtractDeadlineRequest,
    ExtractDeadlineResponse,
} from "./types";
import {
    suggestContextSystemPrompt,
    suggestContextUserPrompt,
} from "../prompts/suggest-context-prompts";
import {
    structurizeSystemPrompt,
    structurizeUserPrompt,
} from "../prompts/structurize-prompts";
import {
    extractDeadlineSystemPrompt,
    extractDeadlineUserPrompt,
} from "../prompts/extract-deadline-prompts";

export class GeminiAIService implements AIService {
    private google: ReturnType<typeof createGoogleGenerativeAI>;
    private config: AIConfig;

    constructor(config: AIConfig) {
        this.config = config;

        // Get API key from config or environment
        const apiKey = config.provider.apiKey;

        if (!apiKey) {
            throw new Error(
                "Google AI API key is required. Please provide it in the config"
            );
        }

        // Create provider with config
        const providerOptions: { apiKey: string; baseURL?: string } = {
            apiKey,
        };
        if (config.provider.baseURL) {
            providerOptions.baseURL = config.provider.baseURL;
        }

        this.google = createGoogleGenerativeAI(providerOptions);
    }

    async suggestContexts(
        request: SuggestContextsRequest
    ): Promise<SuggestContextsResponse> {
        const systemPrompt = suggestContextSystemPrompt();
        const userPrompt = suggestContextUserPrompt(
            request.content,
            request.userContexts
        );

        try {
            const result = await generateText({
                model: this.google(this.config.textGenerationLite.model),
                system: systemPrompt,
                prompt: userPrompt,
                temperature: 0.2, // Low temperature for consistent, faster responses
                topP: 0.8,
                topK: 10,
                providerOptions: {
                    google: {
                        maxOutputTokens: 150, // Limit response size for faster generation
                    },
                },
            });

            const response = result.text || "";

            // Check for empty response
            if (!response || response.trim().length === 0) {
                console.error("Gemini returned empty response");
                throw new AIError("Gemini returned an empty response");
            }

            const suggestions = this.parseSuggestionsJSON(response);
            return { suggestions };
        } catch (error) {
            throw this.handleGeminiError(error);
        }
    }

    async structurizeNote(
        request: StructurizeNoteRequest
    ): Promise<StructurizeNoteResponse> {
        const systemPrompt = structurizeSystemPrompt();
        const userPrompt = structurizeUserPrompt(
            request.content,
            request.userContexts
        );

        try {
            const result = await generateText({
                model: this.google(this.config.textGeneration.model),
                system: systemPrompt,
                prompt: userPrompt,
            });
            const response = result.text || "";
            return { structuredContent: response };
        } catch (error) {
            throw this.handleGeminiError(error);
        }
    }

    private handleGeminiError(error: unknown): AIError {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("quota") || errorMessage.includes("Quota")) {
            return new AIError("Quota exceeded", "QUOTA_EXCEEDED", false);
        }
        if (errorMessage.includes("rate") || errorMessage.includes("Rate")) {
            return new AIError("Rate limit exceeded", "RATE_LIMIT", true);
        }
        return new AIError(
            `Gemini API error: ${errorMessage}`,
            undefined,
            true
        );
    }

    private parseSuggestionsJSON(suggestionsText: string): string[] {
        try {
            const cleanedText = suggestionsText.trim();
            const parsed = JSON.parse(cleanedText);

            // Expect a direct array of strings
            if (!Array.isArray(parsed)) {
                throw new Error("Response is not an array");
            }

            // Filter and validate suggestions
            const validSuggestions = parsed
                .filter(
                    (suggestion: unknown) =>
                        typeof suggestion === "string" &&
                        suggestion.trim().length > 0
                )
                .slice(0, 5) // Limit to 5
                .map((suggestion: string) => suggestion.trim().toLowerCase());

            return validSuggestions;
        } catch (error) {
            console.error("Failed to parse Gemini response as JSON:", error);
            console.error("Raw response:", suggestionsText);
            throw new AIError("Gemini did not return a valid JSON array");
        }
    }

    async extractDeadline(
        request: ExtractDeadlineRequest
    ): Promise<ExtractDeadlineResponse> {
        const systemPrompt = extractDeadlineSystemPrompt();
        const userPrompt = extractDeadlineUserPrompt(request.content);

        try {
            const result = await generateText({
                model: this.google(this.config.textGenerationLite.model),
                system: systemPrompt,
                prompt: userPrompt,
                temperature: 0.1, // Low temperature for deterministic output
                topP: 0.7,
                providerOptions: {
                    google: {
                        maxOutputTokens: 20, // YYYY-MM-DD is 10 chars, "null" is 4. 20 should be safe.
                    },
                },
            });

            const responseText = result.text?.trim() || "";

            if (!responseText || responseText.toLowerCase() === "null") {
                return { deadline: null };
            }

            // Validate if the response is a valid date in YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(responseText)) {
                // Further check if it's a plausible date, though AI should handle this
                const date = new Date(responseText);
                if (!isNaN(date.getTime())) {
                    return { deadline: responseText };
                }
            }

            // If response is not "null" and not a valid YYYY-MM-DD date, treat as no deadline found
            console.warn(
                `Gemini returned an unexpected format for deadline: ${responseText}`
            );
            return { deadline: null };
        } catch (error) {
            throw this.handleGeminiError(error);
        }
    }

    /**
     * Get the underlying language model for direct usage
     * @param modelName - Optional model name to use (defaults to textGeneration model)
     * @returns The Google AI model instance
     */
    getLanguageModel(modelName?: string): LanguageModel {
        const model = modelName || this.config.textGeneration.model;
        return this.google(model);
    }
}
