/**
 * AI Configuration Types
 *
 * Type definitions for user-configurable AI settings.
 * Only LLM (text generation) configuration is user-configurable.
 * Embedding configuration remains local and unchanged.
 */

// Constant arrays for UI dropdowns (defined first to derive types from them)

// Supported AI providers
export const AI_PROVIDERS = ["Google", "OpenAI", "Anthropic"] as const;

export type AIProviderName = (typeof AI_PROVIDERS)[number];

// Google models (whitelisted)
export const GOOGLE_TEXT_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-pro",
] as const;

export type GoogleTextModel = (typeof GOOGLE_TEXT_MODELS)[number];

// OpenAI models
export const OPENAI_TEXT_MODELS = ["gpt-4", "gpt-3.5-turbo"] as const;

export type OpenAITextModel = (typeof OPENAI_TEXT_MODELS)[number];

// Anthropic models
export const ANTHROPIC_TEXT_MODELS = [
    "claude-3-opus",
    "claude-3-sonnet",
] as const;

export type AnthropicTextModel = (typeof ANTHROPIC_TEXT_MODELS)[number];

// Union types for all models
export type TextGenerationModel =
    | GoogleTextModel
    | OpenAITextModel
    | AnthropicTextModel;

// Provider-specific configuration using discriminated unions
export type GoogleProviderConfig = {
    name: "Google";
    apiKey: string;
    baseURL?: string;
};

export type OpenAIProviderConfig = {
    name: "OpenAI";
    apiKey: string;
    baseURL?: string;
};

export type AnthropicProviderConfig = {
    name: "Anthropic";
    apiKey: string;
    baseURL?: string;
};

export type AIProviderConfig =
    | GoogleProviderConfig
    | OpenAIProviderConfig
    | AnthropicProviderConfig;

// User-configurable AI settings with discriminated unions for type safety
export type GoogleAIConfig = {
    provider: GoogleProviderConfig;
    textGenerationModel: GoogleTextModel;
    textGenerationLiteModel: GoogleTextModel;
    agentModel: GoogleTextModel;
};

export type OpenAIAIConfig = {
    provider: OpenAIProviderConfig;
    textGenerationModel: OpenAITextModel;
    textGenerationLiteModel: OpenAITextModel;
    agentModel: OpenAITextModel;
};

export type AnthropicAIConfig = {
    provider: AnthropicProviderConfig;
    textGenerationModel: AnthropicTextModel;
    textGenerationLiteModel: AnthropicTextModel;
    agentModel: AnthropicTextModel;
};

export type UserAIConfig = GoogleAIConfig | OpenAIAIConfig | AnthropicAIConfig;

// Helper function to get models for a specific provider
export function getModelsForProvider(
    providerName: AIProviderName
): readonly string[] {
    switch (providerName) {
        case "Google":
            return GOOGLE_TEXT_MODELS;
        case "OpenAI":
            return OPENAI_TEXT_MODELS;
        case "Anthropic":
            return ANTHROPIC_TEXT_MODELS;
        default:
            // Exhaustiveness check
            const _exhaustive: never = providerName;
            return _exhaustive;
    }
}

// Helper to get default model for a provider
export function getDefaultModelForProvider(
    providerName: AIProviderName
): TextGenerationModel {
    switch (providerName) {
        case "Google":
            return "gemini-2.5-flash";
        case "OpenAI":
            return "gpt-4";
        case "Anthropic":
            return "claude-3-opus";
        default:
            const _exhaustive: never = providerName;
            return _exhaustive;
    }
}
