// Shared types for AI operations

export interface SuggestContextsRequest {
    content: string;
    userContexts: string[];
}

export interface SuggestContextsResponse {
    suggestions: string[];
}

export interface EmbeddingRequest {
    content: string;
}

export interface EmbeddingResponse {
    embedding: number[];
}

// AI Provider interface for abstraction
export interface AIProvider {
    suggestContexts(request: SuggestContextsRequest): Promise<SuggestContextsResponse>;
    generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse>;
}

// Error types
export class AIError extends Error {
    constructor(
        message: string,
        public readonly code?: string,
        public readonly retryable: boolean = true
    ) {
        super(message);
        this.name = "AIError";
    }
}

export class AIRateLimitError extends AIError {
    constructor(message: string = "Rate limit exceeded") {
        super(message, "RATE_LIMIT", true);
        this.name = "AIRateLimitError";
    }
}

export class AIQuotaExceededError extends AIError {
    constructor(message: string = "Quota exceeded") {
        super(message, "QUOTA_EXCEEDED", false);
        this.name = "AIQuotaExceededError";
    }
} 
