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

export interface StructurizeNoteRequest {
    content: string;
    userContexts: string[];
}

export interface StructurizeNoteResponse {
    structuredContent: string;
}

// Q&A types
export interface QARequest {
    question: string;
    context: string; // Combined relevant notes content
    userContexts: string[];
}

export interface QAResponse {
    answer: string;
    relevantSources?: string[]; // Note IDs that were used as context
}

// AI Provider interface for abstraction
export interface AIProvider {
    suggestContexts(request: SuggestContextsRequest): Promise<SuggestContextsResponse>;
    generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse>;
    structurizeNote(request: StructurizeNoteRequest): Promise<StructurizeNoteResponse>;
    answerQuestion(request: QARequest): Promise<QAResponse>;
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
