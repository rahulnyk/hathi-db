import OpenAI from "openai";
import { 
    AIProvider, 
    SuggestContextsRequest, 
    SuggestContextsResponse, 
    EmbeddingRequest, 
    EmbeddingResponse,
    AIError,
    AIRateLimitError,
    AIQuotaExceededError
} from "./types";

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

    async suggestContexts(request: SuggestContextsRequest): Promise<SuggestContextsResponse> {
        const systemPrompt = `
            You are a helpful assistant that suggests relevant contexts for notes based on their content and the user's existing context patterns.
            Always respond with valid JSON arrays of strings.
        `;
        const userPrompt = `
            Given the following note content and known user contexts, suggest up to 5 relevant contexts for the note.
            Note Content: ${request.content}
            Known User Contexts: ${request.userContexts.join(", ")}
            Note: The user contexts are the contexts that the user has used in the past to tag notes.
            Respond with a JSON array of strings.
        `;
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
                suggestions: this.parseSuggestionsJSON(response.choices[0].message.content || ""),
            };
        }
        catch (error) {
            throw this.handleOpenAIError(error);
        }
    }

    async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
        try {
            const response = await this.client.embeddings.create({
                model: "text-embedding-3-small",
                input: request.content,
            });
            return {
                embedding: response.data[0].embedding,
            };
        }
        catch (error) {
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
                throw new Error("Response does not contain a suggestions array");
            }

            // Validate each suggestion is a string
            const suggestions = parsed.suggestions.filter((suggestion: unknown) => 
                typeof suggestion === "string" && suggestion.trim().length > 0
            );

            // Limit to 5 suggestions and ensure they"re properly formatted
            return suggestions
                .slice(0, 5)
                .map((suggestion: string) => suggestion.trim().toLowerCase());

        } catch (error) {
            console.error("Failed to parse OpenAI response as JSON:", error);
            throw new AIError("OpenAI did not return a valid JSON response");
        }
    }


    private handleOpenAIError(error: unknown): AIError {
        if (typeof error === "object" && error !== null && "status" in error) {
            const status = (error as { status: number }).status;

            if (status === 429) {
                return new AIRateLimitError();
            }

            if (status === 402) {
                return new AIQuotaExceededError();
            }
        }

        if (error instanceof Error) {
            return new AIError(error.message);
        }

        return new AIError("Unknown OpenAI error");
    }
}
