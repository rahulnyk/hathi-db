import { FeatureExtractionPipeline, pipeline } from "@huggingface/transformers";
import {
    EmbeddingService,
    EmbeddingConfig,
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

interface TensorData {
    data?: Float32Array | number[];
}

interface OrtTensor extends TensorData {
    length?: number;
}

interface ArrayLikeValue {
    data?: number[];
    length?: number;
}

type PipelineResult = {
    data?: number[];
    tensor?: TensorData;
    ort_tensor?: OrtTensor | Float32Array | number[];
    [key: string]: unknown;
};

export class HuggingFaceEmbeddingService implements EmbeddingService {
    private config: EmbeddingConfig;
    private embeddingPipeline: FeatureExtractionPipeline | null = null;
    private initPromise: Promise<void> | null = null;
    private isInitializing = false;

    constructor(config: EmbeddingConfig) {
        this.config = config;
    }

    private async initializeModel(): Promise<void> {
        if (this.embeddingPipeline) {
            return;
        }

        if (this.isInitializing) {
            if (this.initPromise) {
                return this.initPromise;
            }
        }

        if (!this.initPromise) {
            this.isInitializing = true;
            this.initPromise = this._initializeModel();
        }

        return this.initPromise;
    }

    private async _initializeModel(): Promise<void> {
        try {
            console.log(
                `🤖 Loading embedding model: ${this.config.embedding.model}`
            );

            const featurePipeline = await pipeline(
                "feature-extraction",
                this.config.embedding.model,
                {
                    device: "cpu",
                    dtype: "fp32",
                    revision: "main",
                    cache_dir: "./.cache/huggingface",
                    local_files_only: false,
                }
            );

            this.embeddingPipeline = featurePipeline;

            console.log(
                `✅ Successfully loaded embedding model: ${this.config.embedding.model}`
            );
            this.isInitializing = false;
        } catch (error) {
            this.isInitializing = false;
            this.initPromise = null;

            const errorMessage =
                error instanceof Error ? error.message : String(error);
            console.error(
                "❌ Failed to initialize embedding model:",
                errorMessage
            );
            throw new AIError(
                `Failed to initialize embedding model: ${errorMessage}`,
                "MODEL_INIT_ERROR",
                false
            );
        }
    }

    private async generateEmbeddingVector(text: string): Promise<number[]> {
        try {
            await this.initializeModel();

            if (!this.embeddingPipeline) {
                throw new AIError(
                    "Model not initialized",
                    "MODEL_NOT_INITIALIZED",
                    true
                );
            }

            const prefixedText = this.addE5Prefix(text);
            console.log(
                `🔄 Generating embedding for: "${prefixedText.substring(
                    0,
                    50
                )}..."`
            );

            const result = await Promise.race([
                this.embeddingPipeline(prefixedText, {
                    pooling: "mean",
                    normalize: true,
                }),
                new Promise((_, reject) =>
                    setTimeout(
                        () => reject(new Error("Embedding generation timeout")),
                        30000
                    )
                ),
            ]);

            let embedding: number[];

            if (Array.isArray(result)) {
                embedding = result;
            } else if (result && typeof result === "object") {
                const resultObj = result as PipelineResult;

                if (Array.isArray(resultObj.data)) {
                    embedding = resultObj.data;
                } else if (
                    resultObj.tensor &&
                    typeof resultObj.tensor === "object" &&
                    Array.isArray(resultObj.tensor.data)
                ) {
                    embedding = resultObj.tensor.data;
                } else if ("ort_tensor" in resultObj && resultObj.ort_tensor) {
                    const ortTensor = resultObj.ort_tensor;
                    if (
                        typeof ortTensor === "object" &&
                        ortTensor !== null &&
                        "data" in ortTensor &&
                        ortTensor.data
                    ) {
                        embedding = Array.from(ortTensor.data);
                    } else if (Array.isArray(ortTensor)) {
                        embedding = ortTensor;
                    } else if (
                        typeof ortTensor === "object" &&
                        ortTensor !== null &&
                        "length" in ortTensor
                    ) {
                        embedding = Array.from(ortTensor as ArrayLike<number>);
                    } else {
                        throw new AIError(
                            `Cannot extract data from ort_tensor: ${typeof ortTensor}`,
                            "INVALID_TENSOR_FORMAT",
                            false
                        );
                    }
                } else {
                    const values = Object.values(resultObj);
                    let arrayValue: number[] | null = null;

                    for (const value of values) {
                        if (Array.isArray(value)) {
                            arrayValue = value;
                            break;
                        } else if (
                            value &&
                            typeof value === "object" &&
                            "data" in value
                        ) {
                            const dataValue = (value as ArrayLikeValue).data;
                            if (Array.isArray(dataValue)) {
                                arrayValue = dataValue;
                                break;
                            }
                        } else if (
                            value &&
                            typeof value === "object" &&
                            "length" in value &&
                            typeof (value as ArrayLikeValue).length === "number"
                        ) {
                            arrayValue = Array.from(value as ArrayLike<number>);
                            break;
                        }
                    }

                    if (arrayValue) {
                        embedding = arrayValue;
                    } else {
                        console.error(
                            "Result structure:",
                            JSON.stringify(resultObj, null, 2)
                        );
                        throw new AIError(
                            `Cannot extract embedding from result structure: ${JSON.stringify(
                                Object.keys(resultObj)
                            )}`,
                            "INVALID_RESULT_FORMAT",
                            false
                        );
                    }
                }
            } else {
                throw new AIError(
                    `Unexpected result type: ${typeof result}`,
                    "INVALID_RESULT_TYPE",
                    false
                );
            }

            // Validate embedding
            if (!Array.isArray(embedding)) {
                throw new AIError(
                    `Embedding is not an array: ${typeof embedding}`,
                    "INVALID_EMBEDDING_TYPE",
                    false
                );
            }

            // Handle nested arrays (flatten if needed)
            if (embedding.length > 0 && Array.isArray(embedding[0])) {
                embedding = embedding[0] as number[];
            }

            console.log(
                `📏 Generated embedding with ${embedding.length} dimensions (expected: ${this.config.embedding.dimensions})`
            );

            if (embedding.length !== this.config.embedding.dimensions) {
                throw new AIError(
                    `Invalid embedding dimensions: expected ${this.config.embedding.dimensions}, got ${embedding.length}`,
                    "INVALID_DIMENSIONS",
                    false
                );
            }

            return embedding;
        } catch (error) {
            // Re-throw AIError instances as-is
            if (error instanceof AIError) {
                throw error;
            }

            const errorMessage =
                error instanceof Error ? error.message : String(error);
            console.error("❌ Error generating embedding:", errorMessage);

            // If it's a model initialization error, reset the model
            if (
                errorMessage.includes("model") ||
                errorMessage.includes("pipeline")
            ) {
                this.embeddingPipeline = null;
                this.initPromise = null;
                this.isInitializing = false;
            }

            throw new AIError(
                `Failed to generate embedding: ${errorMessage}`,
                "EMBEDDING_ERROR",
                true
            );
        }
    }

    /**
     * Add appropriate prefix for E5 model
     * E5 models require "query: " or "passage: " prefixes for optimal performance
     */
    private addE5Prefix(text: string): string {
        // If text already has a prefix, don't add another one
        if (text.startsWith("query: ") || text.startsWith("passage: ")) {
            return text;
        }

        // Use "query: " as default prefix (works for both queries and general text)
        return `query: ${text}`;
    }

    async generateEmbedding(
        request: EmbeddingRequest
    ): Promise<EmbeddingResponse> {
        const embedding = await this.generateEmbeddingVector(request.content);
        return { embedding };
    }

    async generateDocumentEmbedding(
        request: DocumentEmbeddingRequest
    ): Promise<DocumentEmbeddingResponse> {
        const prompt = documentEmbeddingPrompt(
            request.content,
            request.contexts,
            request.tags,
            request.noteType
        );

        // For documents, use "passage: " prefix for better retrieval performance
        const prefixedPrompt = `passage: ${prompt}`;
        const embedding = await this.generateEmbeddingVector(prefixedPrompt);

        return { embedding };
    }

    async generateQueryEmbedding(
        request: QueryEmbeddingRequest
    ): Promise<QueryEmbeddingResponse> {
        const prompt = queryEmbeddingPrompt(request.question);

        // For queries, use "query: " prefix for better retrieval performance
        const prefixedPrompt = `query: ${prompt}`;
        const embedding = await this.generateEmbeddingVector(prefixedPrompt);

        return { embedding };
    }

    async generateBatchDocumentEmbeddings(
        request: BatchDocumentEmbeddingRequest
    ): Promise<BatchDocumentEmbeddingResponse> {
        try {
            // Process embeddings in smaller batches to avoid memory issues
            const batchSize = 10; // Process 10 embeddings at a time for local models
            const embeddings: number[][] = [];

            for (let i = 0; i < request.documents.length; i += batchSize) {
                const batch = request.documents.slice(i, i + batchSize);

                // Process this batch in parallel
                const batchPromises = batch.map(async (doc) => {
                    const prompt = documentEmbeddingPrompt(
                        doc.content,
                        doc.contexts,
                        doc.tags,
                        doc.noteType
                    );
                    const prefixedPrompt = `passage: ${prompt}`;
                    return this.generateEmbeddingVector(prefixedPrompt);
                });

                const batchEmbeddings = await Promise.all(batchPromises);
                embeddings.push(...batchEmbeddings);

                // Add a small delay between batches to prevent overloading
                if (i + batchSize < request.documents.length) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
            }

            return { embeddings };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            console.error("Error generating batch embeddings:", errorMessage);
            throw new AIError(
                `Failed to generate batch embeddings: ${errorMessage}`,
                "BATCH_EMBEDDING_ERROR",
                true
            );
        }
    }

    getCurrentEmbeddingConfig(): { model: string; dimensions: number } {
        return {
            model: this.config.embedding.model,
            dimensions: this.config.embedding.dimensions,
        };
    }
}
