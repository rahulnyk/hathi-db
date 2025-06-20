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
        const { content, userContexts } = request;
        const contextsList = userContexts.length > 0
            ? userContexts.map(ctx => `- ${ctx}`).join('\n')
            : 'No existing contexts found';

        const systemPrompt = `
            You are a helpful assistant that suggests relevant contexts for notes based on their content and the user's existing context patterns.
            Always respond with valid JSON arrays of strings.
        `;
        const userPrompt = `
            Given this note content: "${content}" and the user's existing contexts (used in previous notes): ${contextsList}
            You are a helpful assistant that reads notes and suggests 1-5 possible "contexts" or topics that the note could be about.
            A context is like a label or bucket where related notes are grouped.
            If the note is short, it may be ok to suggest 1 or 2 contexts only.
            Never suggest more than 5 contexts for a single note.
            Remember!! Never suggest more than 5 contexts for a single note - it is really important!
            Your response should be a JSON array of strings. Example: ["project-a", "meeting-notes", "grocery-list"]
            If any of the knownContexts are relevant to the note, highly prefer suggesting them as some of your suggestions.
            Known user's existing contexts: ${contextsList}
            Some good examples of contexts are:
            ["work", "meeting-notes", "project-alpha", "ideas", "personal", "health", "finance", "family", "travel", "learn", "entertainment", "personal-development", "self-learning", "actionable-todos", "someday-todos", "upskill", "self-notes", "fitness"]
            "actionable-todos" are todos that are actionable and mostly timebound so possibly have a date or a time deadline with them.
            "someday-todos" are todos that do not have a strict deadline mentioned e.g. find a screen replacement for my phone. Here no deadline or urgency is shown.
            If any of the knownContexts are relevant to the note, highly prefer suggesting them as some of your suggestions.
            Known user's existing contexts: ${contextsList}
            Example response format:
            {
                "suggestions": ["work", "meeting-notes", "project-alpha", "ideas", "personal", "health", "finance", "family", "travel", "learn", "entertainment", "personal-development", "self-learning", "actionable-todos", "someday-todos", "upskill", "self-notes", "fitness"]
            }
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
