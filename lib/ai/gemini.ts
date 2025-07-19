import { GoogleGenAI } from "@google/genai";
import {
    AIProvider,
    EmbeddingRequest,
    EmbeddingResponse,
    DocumentEmbeddingRequest,
    DocumentEmbeddingResponse,
    QueryEmbeddingRequest,
    QueryEmbeddingResponse,
    SuggestContextsRequest,
    SuggestContextsResponse,
    StructurizeNoteRequest,
    StructurizeNoteResponse,
    AIError,
    ExtractDeadlineRequest,
    ExtractDeadlineResponse,
} from "./types";
import {
    documentEmbeddingPrompt,
    queryEmbeddingPrompt,
} from "../prompts/embedding-prompts";
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
import { AI_MODEL_CONFIG } from "../constants/ai-config";

export class GeminiAI implements AIProvider {
    private genAI: GoogleGenAI;
    private textModel: string;
    private embeddingModelName: string;
    private liteTextModel: string;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error(
                "Google AI API key is required. Set GOOGLE_AI_API_KEY environment variable or pass it to the constructor."
            );
        }
        this.genAI = new GoogleGenAI({ apiKey });
        this.textModel = AI_MODEL_CONFIG.GEMINI.textGeneration.model;
        this.liteTextModel = AI_MODEL_CONFIG.GEMINI.textGenerationLite.model;
        this.embeddingModelName = AI_MODEL_CONFIG.GEMINI.embedding.model;
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
            const result = await this.genAI.models.generateContent({
                model: this.liteTextModel,
                contents: [
                    { parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
                ],
                config: {
                    maxOutputTokens: 150, // Limit response size for faster generation
                    temperature: 0.2, // Low temperature for consistent, faster responses
                    topP: 0.8,
                    topK: 10,
                },
            });

            const response =
                result.candidates?.[0]?.content?.parts?.[0]?.text || "";

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

    async generateEmbedding(
        request: EmbeddingRequest
    ): Promise<EmbeddingResponse> {
        try {
            const result = await this.genAI.models.embedContent({
                model: this.embeddingModelName,
                contents: [{ text: request.content }],
                config: {
                    outputDimensionality:
                        AI_MODEL_CONFIG.GEMINI.embedding.dimensions,
                },
            });
            if (!result.embeddings || !result.embeddings[0]?.values) {
                throw new AIError("No embedding generated");
            }
            const embedding = result.embeddings[0].values;

            return {
                embedding: embedding,
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

            const result = await this.genAI.models.embedContent({
                model: this.embeddingModelName,
                contents: [{ text: prompt }],
                config: {
                    outputDimensionality:
                        AI_MODEL_CONFIG.GEMINI.embedding.dimensions,
                },
            });
            if (!result.embeddings || !result.embeddings[0]?.values) {
                throw new AIError("No embedding generated");
            }
            const embedding = result.embeddings[0].values;

            return {
                embedding: embedding,
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

            const result = await this.genAI.models.embedContent({
                model: this.embeddingModelName,
                contents: [{ text: prompt }],
                config: {
                    outputDimensionality:
                        AI_MODEL_CONFIG.GEMINI.embedding.dimensions,
                },
            });
            if (!result.embeddings || !result.embeddings[0]?.values) {
                throw new AIError("No embedding generated");
            }
            const embedding = result.embeddings[0].values;

            return {
                embedding: embedding,
            };
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
            const result = await this.genAI.models.generateContent({
                model: this.textModel,
                contents: [
                    { parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
                ],
            });
            const response =
                result.candidates?.[0]?.content?.parts?.[0]?.text || "";
            return { structuredContent: response };
        } catch (error) {
            throw this.handleGeminiError(error);
        }
    }

    // async answerQuestion(request: QARequest): Promise<QAResponse> {
    //     const systemPrompt = qaSystemPrompt();
    //     const userPrompt = qaUserPrompt(
    //         request.question,
    //         request.context,
    //         request.userContexts
    //     );

    //     try {
    //         const result = await this.genAI.models.generateContent({
    //             model: this.textModel,
    //             contents: [
    //                 { parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
    //             ],
    //         });
    //         const response =
    //             result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    //         return { answer: response };
    //     } catch (error) {
    //         throw this.handleGeminiError(error);
    //     }
    // }

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
            const result = await this.genAI.models.generateContent({
                model: this.liteTextModel,
                contents: [
                    { parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
                ],
                config: {
                    maxOutputTokens: 20, // YYYY-MM-DD is 10 chars, "null" is 4. 20 should be safe.
                    temperature: 0.1, // Low temperature for deterministic output
                    topP: 0.7,
                },
            });

            const responseText =
                result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

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
}
