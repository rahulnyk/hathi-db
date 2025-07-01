import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import {
    AIProvider,
    SuggestContextsRequest,
    SuggestContextsResponse,
    DocumentEmbeddingRequest,
    DocumentEmbeddingResponse,
    QueryEmbeddingRequest,
    QueryEmbeddingResponse,
    StructurizeNoteRequest,
    StructurizeNoteResponse,
    AIError,
    AIRateLimitError,
    AIQuotaExceededError,
    QARequest,
    QAResponse,
} from "./types";

import {
    structurizeSystemPrompt,
    structurizeUserPrompt,
} from "../prompts/structurize-prompts";

import {
    suggestContextSystemPrompt,
    suggestContextUserPrompt,
} from "../prompts/suggest-context-prompts";

import {
    qaSystemPrompt,
    qaUserPrompt,
} from "../prompts/qa-prompts";

import {
    documentEmbeddingPrompt,
    queryEmbeddingPrompt,
} from "../prompts/embedding-prompts";

export class GeminiProvider implements AIProvider {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;
    private embeddingModel: GenerativeModel;

    constructor() {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            throw new Error("GOOGLE_AI_API_KEY environment variable is required");
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        this.embeddingModel = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
    }

    async suggestContexts(
        request: SuggestContextsRequest
    ): Promise<SuggestContextsResponse> {
        const { content, userContexts } = request;

        const systemPrompt = suggestContextSystemPrompt();
        const userPrompt = suggestContextUserPrompt(content, userContexts);

        try {
            const result = await this.model.generateContent(
                `${systemPrompt}\n\n${userPrompt}`
            );

            const response = await result.response;
            const text = response.text();

            return {
                suggestions: this.parseSuggestionsJSON(text),
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

            const result = await this.embeddingModel.embedContent(prompt);
            const embedding = result.embedding.values;

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

            const result = await this.embeddingModel.embedContent(prompt);
            const embedding = result.embedding.values;

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
        const { content, userContexts } = request;
        const systemPrompt = structurizeSystemPrompt();
        const userPrompt = structurizeUserPrompt(content, userContexts);

        try {
            const result = await this.model.generateContent(
                `${systemPrompt}\n\n${userPrompt}`
            );

            const response = await result.response;
            const text = response.text();

            return {
                structuredContent: text,
            };
        } catch (error) {
            throw this.handleGeminiError(error);
        }
    }

    async answerQuestion(request: QARequest): Promise<QAResponse> {
        const { question, context, userContexts } = request;

        const systemPrompt = qaSystemPrompt();
        const userPrompt = qaUserPrompt(question, context, userContexts);

        try {
            const result = await this.model.generateContent(
                `${systemPrompt}\n\n${userPrompt}`
            );

            const response = await result.response;
            const answer = response.text();

            if (!answer) {
                throw new AIError("No answer generated");
            }

            return {
                answer: answer.trim(),
                relevantSources: [], // Could be enhanced to track which notes were most relevant
            };
        } catch (error) {
            throw this.handleGeminiError(error);
        }
    }

    // private methods

    private parseSuggestionsJSON(suggestionsText: string): string[] {
        try {
            // Clean up the response - remove markdown formatting if present
            let cleanedText = suggestionsText.trim();

            // Remove markdown code blocks if present
            if (cleanedText.startsWith('```json')) {
                cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanedText.startsWith('```')) {
                cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const parsed = JSON.parse(cleanedText);

            let suggestions: string[] = [];

            // Handle both array and object formats
            if (Array.isArray(parsed)) {
                // Direct array format: ["suggestion1", "suggestion2", ...]
                suggestions = parsed;
            } else if (parsed && typeof parsed === "object" && Array.isArray(parsed.suggestions)) {
                // Object format: { "suggestions": ["suggestion1", "suggestion2", ...] }
                suggestions = parsed.suggestions;
            } else {
                throw new Error("Response does not contain a valid suggestions array");
            }

            // Validate each suggestion is a string
            const validSuggestions = suggestions.filter(
                (suggestion: unknown) =>
                    typeof suggestion === "string" &&
                    suggestion.trim().length > 0
            );

            // Limit to 5 suggestions and ensure they're properly formatted
            return validSuggestions
                .slice(0, 5)
                .map((suggestion: string) => suggestion.trim().toLowerCase());
        } catch (error) {
            console.error("Failed to parse Gemini response as JSON:", error);
            console.error("Raw response:", suggestionsText);
            throw new AIError("Gemini did not return a valid JSON response");
        }
    }

    private handleGeminiError(error: unknown): AIError {
        console.error("Gemini API error:", error);

        // Handle rate limiting
        if (error instanceof Error && (error.message?.includes("rate limit") || error.message?.includes("quota"))) {
            return new AIRateLimitError("Gemini API rate limit exceeded");
        }

        // Handle quota exceeded
        if (error instanceof Error && error.message?.includes("quota exceeded")) {
            return new AIQuotaExceededError("Gemini API quota exceeded");
        }

        // Handle other errors
        return new AIError(
            error instanceof Error ? error.message : "An error occurred with the Gemini API"
        );
    }
}