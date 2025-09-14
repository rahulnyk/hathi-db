import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed, embedMany } from "ai";
import {
    EmbeddingService,
    AIConfig,
    EmbeddingRequest,
    EmbeddingResponse,
    DocumentEmbeddingRequest,
    DocumentEmbeddingResponse,
    QueryEmbeddingRequest,
    QueryEmbeddingResponse,
    BatchDocumentEmbeddingRequest,
    BatchDocumentEmbeddingResponse,
    AIError,
} from "./types";
import {
    documentEmbeddingPrompt,
    queryEmbeddingPrompt,
} from "../prompts/embedding-prompts";

export class GeminiEmbeddingService implements EmbeddingService {
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

    async generateEmbedding(
        request: EmbeddingRequest
    ): Promise<EmbeddingResponse> {
        try {
            const result = await embed({
                model: this.google.textEmbedding(this.config.embedding.model),
                value: request.content,
                providerOptions: {
                    google: {
                        outputDimensionality: this.config.embedding.dimensions,
                    },
                },
            });

            return {
                embedding: result.embedding,
            };
        } catch (error) {
            throw this.handleGeminiError(error);
        }
    }

    async generateDocumentEmbedding(
        request: DocumentEmbeddingRequest
    ): Promise<DocumentEmbeddingResponse> {
        try {
            const prompt = documentEmbeddingPrompt(
                request.content,
                request.contexts,
                request.tags,
                request.noteType
            );

            const result = await embed({
                model: this.google.textEmbedding(this.config.embedding.model),
                value: prompt,
                providerOptions: {
                    google: {
                        outputDimensionality: this.config.embedding.dimensions,
                    },
                },
            });

            return {
                embedding: result.embedding,
            };
        } catch (error) {
            throw this.handleGeminiError(error);
        }
    }

    async generateQueryEmbedding(
        request: QueryEmbeddingRequest
    ): Promise<QueryEmbeddingResponse> {
        try {
            const prompt = queryEmbeddingPrompt(request.question);

            const result = await embed({
                model: this.google.textEmbedding(this.config.embedding.model),
                value: prompt,
                providerOptions: {
                    google: {
                        outputDimensionality: this.config.embedding.dimensions,
                    },
                },
            });

            return {
                embedding: result.embedding,
            };
        } catch (error) {
            throw this.handleGeminiError(error);
        }
    }

    async generateBatchDocumentEmbeddings(
        request: BatchDocumentEmbeddingRequest
    ): Promise<BatchDocumentEmbeddingResponse> {
        try {
            // Process embeddings in parallel batches to avoid overwhelming the API
            const batchSize = 5; // Process 5 embeddings at a time
            const embeddings: number[][] = [];

            for (let i = 0; i < request.documents.length; i += batchSize) {
                const batch = request.documents.slice(i, i + batchSize);

                // Prepare prompts for this batch
                const prompts = batch.map((doc) =>
                    documentEmbeddingPrompt(
                        doc.content,
                        doc.contexts,
                        doc.tags,
                        doc.noteType
                    )
                );

                // Process this batch using embedMany
                const result = await embedMany({
                    model: this.google.textEmbedding(
                        this.config.embedding.model
                    ),
                    values: prompts,
                    providerOptions: {
                        google: {
                            outputDimensionality:
                                this.config.embedding.dimensions,
                        },
                    },
                });

                if (!result.embeddings || result.embeddings.length === 0) {
                    throw new AIError(
                        `No embeddings generated for batch: ${i}-${
                            i + batch.length
                        }`
                    );
                }

                embeddings.push(...result.embeddings);

                // Add a small delay between batches to be respectful to the API
                if (i + batchSize < request.documents.length) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            }

            return { embeddings };
        } catch (error) {
            throw this.handleGeminiError(error);
        }
    }

    getCurrentEmbeddingConfig(): { model: string; dimensions: number } {
        return {
            model: this.config.embedding.model,
            dimensions: this.config.embedding.dimensions,
        };
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
}
