import type { LanguageModel } from "ai";

// Configuration types
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
    embedding: {
        model: string;
        dimensions: number;
    };
    provider: AIProviderConfig;
}

// Shared types for AI operations

export interface SuggestContextsRequest {
    content: string;
    userContexts: string[];
}

export interface SuggestContextsResponse {
    suggestions: string[];
}

// Basic embedding types
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
