import OpenAI from "openai";
import {
    AIProvider,
    SuggestContextsRequest,
    SuggestContextsResponse,
    EmbeddingRequest,
    EmbeddingResponse,
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

export class OpenAIProvider implements AIProvider {
    private client: OpenAI;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OPENAI_API_KEY environment variable is required");
        }

        this.client = new OpenAI({
            apiKey,
        });
    }

    async suggestContexts(
        request: SuggestContextsRequest
    ): Promise<SuggestContextsResponse> {
        const { content, userContexts } = request;

        const systemPrompt = suggestContextSystemPrompt();
        const userPrompt = suggestContextUserPrompt(content, userContexts);

        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                max_tokens: 150,
                temperature: 0.3,
                response_format: { type: "json_object" },
            });
            return {
                suggestions: this.parseSuggestionsJSON(
                    response.choices[0].message.content || ""
                ),
            };
        } catch (error) {
            throw this.handleOpenAIError(error);
        }
    }

    async generateEmbedding(
        request: EmbeddingRequest
    ): Promise<EmbeddingResponse> {
        try {
            const response = await this.client.embeddings.create({
                model: "text-embedding-3-small",
                input: request.content,
            });
            return {
                embedding: response.data[0].embedding,
            };
        } catch (error) {
            throw this.handleOpenAIError(error);
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

            const response = await this.client.embeddings.create({
                model: "text-embedding-3-small",
                input: prompt,
            });
            return {
                embedding: response.data[0].embedding,
            };
        } catch (error) {
            throw this.handleOpenAIError(error);
        }
    }

    async generateQueryEmbedding(
        request: QueryEmbeddingRequest
    ): Promise<QueryEmbeddingResponse> {
        try {
            const prompt = queryEmbeddingPrompt(request.question);

            const response = await this.client.embeddings.create({
                model: "text-embedding-3-small",
                input: prompt,
            });
            return {
                embedding: response.data[0].embedding,
            };
        } catch (error) {
            throw this.handleOpenAIError(error);
        }
    }

    async structurizeNote(
        request: StructurizeNoteRequest
    ): Promise<StructurizeNoteResponse> {
        const { content, userContexts } = request;
        const systemPrompt = structurizeSystemPrompt();

        const userPrompt = structurizeUserPrompt(content, userContexts);

        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                max_tokens: 1000,
                temperature: 0.3,
            });

            return {
                structuredContent: response.choices[0].message.content || "",
            };
        } catch (error) {
            throw this.handleOpenAIError(error);
        }
    }

    async answerQuestion(request: QARequest): Promise<QAResponse> {
        const { question, context, userContexts } = request;

        const systemPrompt = qaSystemPrompt();
        const userPrompt = qaUserPrompt(question, context, userContexts);

        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature: 0.7,
                max_tokens: 1000,
            });

            const answer = response.choices[0]?.message?.content;
            if (!answer) {
                throw new AIError("No answer generated");
            }

            return {
                answer: answer.trim(),
                relevantSources: [], // Could be enhanced to track which notes were most relevant
            };
        } catch (error) {
            throw this.handleOpenAIError(error);
        }
    }

    // private methods

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
            console.error("Failed to parse OpenAI response as JSON:", error);
            throw new AIError("OpenAI did not return a valid JSON response");
        }
    }

    private handleOpenAIError(error: unknown): AIError {
        console.error("OpenAI API error:", error);

        // Handle rate limiting
        if (error && typeof error === "object" && "status" in error && error.status === 429) {
            return new AIRateLimitError("OpenAI API rate limit exceeded");
        }

        // Handle quota exceeded
        if (error && typeof error === "object" && "status" in error && error.status === 402) {
            return new AIQuotaExceededError("OpenAI API quota exceeded");
        }

        // Handle other errors
        return new AIError(
            error instanceof Error ? error.message : "An error occurred with the OpenAI API"
        );
    }
}
