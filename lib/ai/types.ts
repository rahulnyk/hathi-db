import type { LanguageModel } from "ai";

export interface AIProviderConfig {
    name: string;
    apiKey?: string;
    baseURL?: string | null;
}

export interface AIConfig {
    textGeneration: {
        model: string;
    };
    textGenerationLite: {
        model: string;
    };
    agentModel: {
        model: string;
    };
    provider: AIProviderConfig;
}

export interface EmbeddingConfig {
    embedding: {
        model: string;
        dimensions: number;
    };
    provider: AIProviderConfig;
}

export interface SuggestContextsRequest {
    content: string;
    userContexts: string[];
}

export interface ContextSuggestionWithConfidence {
    context: string;
    confidence: "High" | "Low";
}

export interface SuggestContextsResponse {
    suggestions: ContextSuggestionWithConfidence[];
}

export interface EmbeddingRequest {
    content: string;
}

export interface EmbeddingResponse {
    embedding: number[];
}

// New types for optimized embeddings
export interface DocumentEmbeddingRequest {
    content: string;
    contexts?: string[];
    tags?: string[];
    noteType?: string;
}

export interface QueryEmbeddingRequest {
    question: string;
}

export interface DocumentEmbeddingResponse {
    embedding: number[];
    model: string;
}

export interface QueryEmbeddingResponse {
    embedding: number[];
}

// Batch embedding types
export interface BatchDocumentEmbeddingRequest {
    documents: DocumentEmbeddingRequest[];
}

export interface BatchDocumentEmbeddingResponse {
    embeddings: number[][];
}

export interface StructurizeNoteRequest {
    content: string;
    userContexts: string[];
}

export interface StructurizeNoteResponse {
    structuredContent: string;
}

// Types for deadline extraction
export interface ExtractDeadlineRequest {
    content: string;
}

export interface ExtractDeadlineResponse {
    deadline: string | null; // YYYY-MM-DD or null
}

// AI Service interface for abstraction
export interface AIService {
    suggestContexts(
        request: SuggestContextsRequest
    ): Promise<SuggestContextsResponse>;
    structurizeNote(
        request: StructurizeNoteRequest
    ): Promise<StructurizeNoteResponse>;
    // answerQuestion(request: QARequest): Promise<QAResponse>;
    extractDeadline(
        request: ExtractDeadlineRequest
    ): Promise<ExtractDeadlineResponse>;
    // Expose the underlying AI provider for direct model usage
    getLanguageModel(modelName?: string): LanguageModel;
}

export interface EmbeddingService {
    generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse>;
    generateDocumentEmbedding(
        request: DocumentEmbeddingRequest
    ): Promise<DocumentEmbeddingResponse>;
    generateQueryEmbedding(
        request: QueryEmbeddingRequest
    ): Promise<QueryEmbeddingResponse>;
    generateBatchDocumentEmbeddings(
        request: BatchDocumentEmbeddingRequest
    ): Promise<BatchDocumentEmbeddingResponse>;
    getCurrentEmbeddingConfig(): { model: string; dimensions: number };
}

// Error types
export enum AIErrorType {
    RATE_LIMIT = "RATE_LIMIT",
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
    NETWORK_ERROR = "NETWORK_ERROR",
    INVALID_RESPONSE = "INVALID_RESPONSE",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    UNKNOWN = "UNKNOWN",
}

export interface AIErrorDetails {
    type: AIErrorType;
    message: string;
    retryable: boolean;
    userMessage: string; // User-friendly message
    technicalDetails?: string; // Optional technical details for debugging
}

export type ServerActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string; errorDetails?: AIErrorDetails };

export class AIError extends Error {
    public readonly errorType: AIErrorType;
    public readonly userMessage: string;
    public readonly technicalDetails?: string;

    constructor(
        message: string,
        public readonly code?: string,
        public readonly retryable: boolean = true,
        errorType?: AIErrorType,
        userMessage?: string,
        technicalDetails?: string
    ) {
        super(message);
        this.name = "AIError";
        this.errorType = errorType || AIErrorType.UNKNOWN;
        this.userMessage =
            userMessage || "An error occurred. Please try again.";
        this.technicalDetails = technicalDetails;
    }

    toErrorDetails(): AIErrorDetails {
        return {
            type: this.errorType,
            message: this.message,
            retryable: this.retryable,
            userMessage: this.userMessage,
            technicalDetails: this.technicalDetails,
        };
    }
}

export class AIRateLimitError extends AIError {
    constructor(message: string = "Rate limit exceeded") {
        super(
            message,
            "RATE_LIMIT",
            true,
            AIErrorType.RATE_LIMIT,
            "AI service is busy. Please try again in a moment.",
            message
        );
        this.name = "AIRateLimitError";
    }
}

export class AIQuotaExceededError extends AIError {
    constructor(message: string = "Quota exceeded") {
        super(
            message,
            "QUOTA_EXCEEDED",
            false,
            AIErrorType.QUOTA_EXCEEDED,
            "AI quota exceeded. Please check your API settings.",
            message
        );
        this.name = "AIQuotaExceededError";
    }
}

export class AINetworkError extends AIError {
    constructor(message: string = "Network error") {
        super(
            message,
            "NETWORK_ERROR",
            true,
            AIErrorType.NETWORK_ERROR,
            "Network error. Please check your connection and try again.",
            message
        );
        this.name = "AINetworkError";
    }
}

export class AIInvalidResponseError extends AIError {
    constructor(message: string = "Invalid response") {
        super(
            message,
            "INVALID_RESPONSE",
            true,
            AIErrorType.INVALID_RESPONSE,
            "AI returned an unexpected response. Please try again.",
            message
        );
        this.name = "AIInvalidResponseError";
    }
}

export class AIAuthenticationError extends AIError {
    constructor(message: string = "Authentication failed") {
        super(
            message,
            "AUTHENTICATION_ERROR",
            false,
            AIErrorType.AUTHENTICATION_ERROR,
            "Authentication failed. Please check your API key.",
            message
        );
        this.name = "AIAuthenticationError";
    }
}

/**
 * Helper function to classify and create appropriate error from API responses
 */
export function classifyAIError(error: unknown): AIError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const lowerMessage = errorMessage.toLowerCase();

    // Check for rate limit errors
    if (lowerMessage.includes("rate") || lowerMessage.includes("429")) {
        return new AIRateLimitError(errorMessage);
    }

    // Check for quota errors
    if (lowerMessage.includes("quota") || lowerMessage.includes("limit")) {
        return new AIQuotaExceededError(errorMessage);
    }

    // Check for network errors
    if (
        lowerMessage.includes("network") ||
        lowerMessage.includes("timeout") ||
        lowerMessage.includes("econnrefused") ||
        lowerMessage.includes("enotfound") ||
        lowerMessage.includes("getaddrinfo") ||
        lowerMessage.includes("fetch") ||
        lowerMessage.includes("failed after") ||
        lowerMessage.includes("cannot connect") ||
        lowerMessage.includes("503") ||
        lowerMessage.includes("500")
    ) {
        return new AINetworkError(errorMessage);
    }

    // Check for authentication errors
    if (
        lowerMessage.includes("auth") ||
        lowerMessage.includes("unauthorized") ||
        lowerMessage.includes("401") ||
        lowerMessage.includes("403") ||
        lowerMessage.includes("api key")
    ) {
        return new AIAuthenticationError(errorMessage);
    }

    // Check for invalid response errors
    if (
        lowerMessage.includes("json") ||
        lowerMessage.includes("parse") ||
        lowerMessage.includes("invalid")
    ) {
        return new AIInvalidResponseError(errorMessage);
    }

    // Default to unknown error
    return new AIError(
        errorMessage,
        "UNKNOWN",
        true,
        AIErrorType.UNKNOWN,
        "An unexpected error occurred. Please try again.",
        errorMessage
    );
}
