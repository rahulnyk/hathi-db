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

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export class GeminiProvider implements AIProvider {
    private genAI: GoogleGenAI;
    private textModel: string;
    private embeddingModelName: string;

    constructor() {
        this.genAI = genAI;
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
            const suggestions = response.split('\n').filter((line: string) => line.trim().length > 0);
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
                    outputDimensionality: 1536
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
                    outputDimensionality: 1536
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
                    outputDimensionality: 1536
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
}