"use client";

import { useState, useEffect } from "react";
import {
    UserAIConfig,
    AIProviderName,
    TextGenerationModel,
    AI_PROVIDERS,
    getModelsForProvider,
    getDefaultModelForProvider,
} from "@/lib/ai/ai-config-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, AlertCircle, Save } from "lucide-react";

export function AIConfigSection() {
    const [config, setConfig] = useState<UserAIConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        valid: boolean;
        message: string;
    } | null>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const response = await fetch("/api/preferences/ai-config");
            const data = await response.json();
            setConfig(data);
        } catch (error) {
            console.error("Failed to load AI config:", error);
        } finally {
            setLoading(false);
        }
    };

    const validateConfig = async () => {
        if (!config) return;

        setValidating(true);
        setValidationResult(null);

        try {
            const response = await fetch(
                "/api/preferences/ai-config/validate",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(config),
                }
            );

            const result = await response.json();

            if (result.valid) {
                setValidationResult({
                    valid: true,
                    message: "API key validated successfully",
                });
            } else {
                setValidationResult({
                    valid: false,
                    message:
                        result.error || "Configuration could not be validated",
                });
            }
        } catch (error) {
            console.error("Failed to validate AI config:", error);
            setValidationResult({
                valid: false,
                message: "Failed to validate configuration",
            });
        } finally {
            setValidating(false);
        }
    };

    const saveConfig = async () => {
        if (!config) return;

        setSaving(true);
        try {
            const response = await fetch("/api/preferences/ai-config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });

            if (!response.ok) {
                throw new Error("Failed to save configuration");
            }

            // Show success via validation result temporarily or just alert
            setValidationResult({
                valid: true,
                message: "Configuration saved successfully",
            });

            // Clear success message after 3 seconds
            setTimeout(() => setValidationResult(null), 3000);
        } catch (error) {
            console.error("Failed to save AI config:", error);
            setValidationResult({
                valid: false,
                message: `Failed to save configuration${
                    error instanceof Error && error.message
                        ? `: ${error.message}`
                        : ""
                }`,
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!config)
        return (
            <div className="text-xs text-red-500">
                Failed to load configuration
            </div>
        );

    return (
        <div className="flex flex-col gap-4 pb-8">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                    AI Configuration
                </h3>
                <Button
                    onClick={saveConfig}
                    disabled={saving}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs hover:bg-secondary/50"
                >
                    {saving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <div className="flex items-center gap-1">
                            <Save className="h-3 w-3" />
                            <span>Save</span>
                        </div>
                    )}
                </Button>
            </div>

            {/* Provider Selection */}
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-0.5">
                    <Label className="text-xs font-medium text-foreground">
                        Provider
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                        Select the AI provider you want to use.
                    </p>
                </div>
                <Select
                    value={config.provider.name}
                    onValueChange={(value) => {
                        const newProvider = value as AIProviderName;
                        const defaultModel =
                            getDefaultModelForProvider(newProvider);

                        // Reset to provider-specific defaults when switching providers
                        setConfig({
                            provider: {
                                name: newProvider,
                                apiKey: config.provider.apiKey,
                                baseURL: config.provider.baseURL,
                            },
                            textGenerationModel: defaultModel,
                            textGenerationLiteModel: defaultModel,
                            agentModel: defaultModel,
                        } as UserAIConfig);
                        setValidationResult(null);
                    }}
                >
                    <SelectTrigger className="w-full h-8 text-xs bg-secondary/20 hover:bg-secondary/40 border-primary/20 transition-colors">
                        <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                        {AI_PROVIDERS.map((provider) => {
                            const isComingSoon = provider !== "Google";
                            const displayName =
                                provider === "Google"
                                    ? "Google (Gemini)"
                                    : provider === "OpenAI"
                                    ? "OpenAI"
                                    : "Anthropic";

                            return (
                                <SelectItem
                                    key={provider}
                                    value={provider}
                                    disabled={isComingSoon}
                                    className="text-xs"
                                >
                                    {displayName}
                                    {isComingSoon ? " (Coming Soon)" : ""}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>

            {/* Base URL (Optional) */}
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-0.5">
                    <Label className="text-xs font-medium text-foreground">
                        Base URL (Optional)
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                        Override the default API endpoint if needed.
                    </p>
                </div>
                <Input
                    value={config.provider.baseURL || ""}
                    onChange={(e) => {
                        setConfig({
                            ...config,
                            provider: {
                                ...config.provider,
                                baseURL: e.target.value || undefined,
                            },
                        } as UserAIConfig);
                        setValidationResult(null);
                    }}
                    placeholder="Leave empty for default"
                    className="w-full h-8 text-xs"
                />
            </div>

            {/* Model Selection */}
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-0.5">
                    <Label className="text-xs font-medium text-foreground">
                        Text Generation Model
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                        Model used for general text generation and chat.
                    </p>
                </div>
                <Select
                    value={config.textGenerationModel}
                    onValueChange={(value) =>
                        setConfig({
                            ...config,
                            textGenerationModel: value as TextGenerationModel,
                        } as UserAIConfig)
                    }
                >
                    <SelectTrigger className="w-full h-8 text-xs bg-secondary/20 hover:bg-secondary/40 border-primary/20 transition-colors">
                        <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                        {getModelsForProvider(config.provider.name).map(
                            (model) => (
                                <SelectItem
                                    key={model}
                                    value={model}
                                    className="text-xs"
                                >
                                    {model}
                                </SelectItem>
                            )
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-0.5">
                    <Label className="text-xs font-medium text-foreground">
                        Lite Model
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                        Faster, cheaper model for background tasks.
                    </p>
                </div>
                <Select
                    value={config.textGenerationLiteModel}
                    onValueChange={(value) =>
                        setConfig({
                            ...config,
                            textGenerationLiteModel:
                                value as TextGenerationModel,
                        } as UserAIConfig)
                    }
                >
                    <SelectTrigger className="w-full h-8 text-xs bg-secondary/20 hover:bg-secondary/40 border-primary/20 transition-colors">
                        <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                        {getModelsForProvider(config.provider.name).map(
                            (model) => (
                                <SelectItem
                                    key={model}
                                    value={model}
                                    className="text-xs"
                                >
                                    {model}
                                </SelectItem>
                            )
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-0.5">
                    <Label className="text-xs font-medium text-foreground">
                        Agent Model
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                        Model used by the AI agent for complex reasoning.
                    </p>
                </div>
                <Select
                    value={config.agentModel}
                    onValueChange={(value) =>
                        setConfig({
                            ...config,
                            agentModel: value as TextGenerationModel,
                        } as UserAIConfig)
                    }
                >
                    <SelectTrigger className="w-full h-8 text-xs bg-secondary/20 hover:bg-secondary/40 border-primary/20 transition-colors">
                        <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                        {getModelsForProvider(config.provider.name).map(
                            (model) => (
                                <SelectItem
                                    key={model}
                                    value={model}
                                    className="text-xs"
                                >
                                    {model}
                                </SelectItem>
                            )
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* API Key */}
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-0.5">
                    <Label className="text-xs font-medium text-foreground">
                        API Key
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                        Enter your API key for the selected provider.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Input
                        type="password"
                        value={config.provider.apiKey}
                        onChange={(e) => {
                            setConfig({
                                ...config,
                                provider: {
                                    ...config.provider,
                                    apiKey: e.target.value,
                                },
                            } as UserAIConfig);
                            setValidationResult(null);
                        }}
                        placeholder="Enter your API key"
                        className="flex-1 h-8 text-xs"
                    />
                    <Button
                        onClick={validateConfig}
                        disabled={validating || !config.provider.apiKey}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs whitespace-nowrap"
                    >
                        {validating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            "Check"
                        )}
                    </Button>
                </div>
            </div>

            {/* Validation Result */}
            {validationResult && (
                <Alert
                    variant={validationResult.valid ? "default" : "destructive"}
                    className={`py-2 px-3 ${
                        validationResult.valid
                            ? "border-green-500 text-green-500"
                            : ""
                    }`}
                >
                    {validationResult.valid ? (
                        <Check className="h-3 w-3" />
                    ) : (
                        <AlertCircle className="h-3 w-3" />
                    )}
                    <AlertDescription className="ml-2 text-xs">
                        {validationResult.message}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
