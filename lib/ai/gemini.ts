import { GoogleGenAI } from '@google/genai';
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
    QARequest,
    QAResponse,
    AIError
} from './types';
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
    qaSystemPrompt,
    qaUserPrompt,
} from "../prompts/qa-prompts";
import { AI_MODEL_CONFIG } from '../constants/ai-config';


export class GeminiAI implements AIProvider {
    private genAI: GoogleGenAI;
    private textModel: string;
    private embeddingModelName: string;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error('Google AI API key is required. Set GOOGLE_AI_API_KEY environment variable or pass it to the constructor.');
        }
        this.genAI = new GoogleGenAI({ apiKey });
        this.textModel = AI_MODEL_CONFIG.GEMINI.textGeneration.model;
        this.embeddingModelName = AI_MODEL_CONFIG.GEMINI.embedding.model;
    }

    async suggestContexts(request: SuggestContextsRequest): Promise<SuggestContextsResponse> {
        const systemPrompt = suggestContextSystemPrompt();
        const userPrompt = suggestContextUserPrompt(request.content, request.userContexts);

        try {
            const result = await this.genAI.models.generateContent({
                model: this.textModel,
                contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }]
            });
            const response = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const suggestions = this.parseSuggestionsJSON(response);
            return { suggestions };
        } catch (error) {
            throw this.handleGeminiError(error);
        }
    }

    async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
        try {
            const result = await this.genAI.models.embedContent({
                model: this.embeddingModelName,
                contents: [{ text: request.content }],
                config: {
                    outputDimensionality: AI_MODEL_CONFIG.GEMINI.embedding.dimensions
                }
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
                    outputDimensionality: AI_MODEL_CONFIG.GEMINI.embedding.dimensions
                }
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
                    outputDimensionality: AI_MODEL_CONFIG.GEMINI.embedding.dimensions
                }
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

    async structurizeNote(request: StructurizeNoteRequest): Promise<StructurizeNoteResponse> {
        const systemPrompt = structurizeSystemPrompt();
        const userPrompt = structurizeUserPrompt(request.content, request.userContexts);

        try {
            const result = await this.genAI.models.generateContent({
                model: this.textModel,
                contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }]
            });
            const response = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return { structuredContent: response };
        } catch (error) {
            throw this.handleGeminiError(error);
        }
    }

    async answerQuestion(request: QARequest): Promise<QAResponse> {
        const systemPrompt = qaSystemPrompt();
        const userPrompt = qaUserPrompt(request.question, request.context, request.userContexts);

        try {
            const result = await this.genAI.models.generateContent({
                model: this.textModel,
                contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }]
            });
            const response = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return { answer: response };
        } catch (error) {
            throw this.handleGeminiError(error);
        }
    }

    private handleGeminiError(error: unknown): AIError {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('quota') || errorMessage.includes('Quota')) {
            return new AIError('Quota exceeded', 'QUOTA_EXCEEDED', false);
        }
        if (errorMessage.includes('rate') || errorMessage.includes('Rate')) {
            return new AIError('Rate limit exceeded', 'RATE_LIMIT', true);
        }
        return new AIError(`Gemini API error: ${errorMessage}`, undefined, true);
    }

    private parseSuggestionsJSON(suggestionsText: string): string[] {
        try {
            const parsed = JSON.parse(suggestionsText);

            // Validate the response structure
            if (!parsed || typeof parsed !== "object") {
                throw new Error("Response is not an object");
            }

            if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
                throw new Error(
                    "Response does not contain a suggestions array"
                );
            }

            // Validate each suggestion is a string
            const suggestions = parsed.suggestions.filter(
                (suggestion: unknown) =>
                    typeof suggestion === "string" &&
                    suggestion.trim().length > 0
            );

            // Limit to 5 suggestions and ensure they're properly formatted
            return suggestions
                .slice(0, 5)
                .map((suggestion: string) => suggestion.trim().toLowerCase());
        } catch (error) {
            console.error("Failed to parse Gemini response as JSON:", error);
            throw new AIError("Gemini did not return a valid JSON response");
        }
    }
}