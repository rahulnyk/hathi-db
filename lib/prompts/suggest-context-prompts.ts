import {
    CONTEXT_DEFINITION,
    CONTEXT_FORMAT_RULES,
    CONTEXT_EXAMPLES,
} from "./context-definitions";

const MAX_CONTEXTS_PER_NOTE = 4;

/**
 * Generates a system prompt that defines context suggestion behavior and guidelines.
 * @returns A formatted string prompt with context suggestion rules.
 */
export function suggestContextSystemPrompt(): string {
    return `Analyze note content and suggest relevant contexts (tags).

${CONTEXT_DEFINITION}

## Guidelines
1. Reuse existing contexts if relevant.
2. Extract proper nouns, entities, specific topics.
3. Suggest concrete categories (e.g. Work, Personal, Health).

## Constraints (CRITICAL)
- Max ${MAX_CONTEXTS_PER_NOTE} contexts.
- **HIGH CONFIDENCE ONLY**: If unsure, return []. Do NOT guess.
- 90%+ certainty required for every suggestion.

${CONTEXT_FORMAT_RULES}

## Response Format
- ONLY a valid JSON array of strings.
- No markdown, no explanations.
- Title Case ("Project Alpha").

${CONTEXT_EXAMPLES}`;
}

/**
 * Generates a user prompt for suggesting context based on content and a list of contexts.
 * @param content The main content to consider for context suggestions.
 * @param contextsList The list of available contexts to suggest from.
 * @returns A formatted string prompt for context suggestions.
 */
export function suggestContextUserPrompt(
    content: string,
    contextsList: string[]
): string {
    const contextsListString =
        contextsList.length > 0
            ? contextsList.join(", ")
            : "None";

    const prompt = `Note Content:
"${content}"

Existing Contexts: ${contextsListString}

## Task
Suggest 0-${MAX_CONTEXTS_PER_NOTE} high-confidence contexts.
JSON Array Only.`;

    return prompt.trim();
}
