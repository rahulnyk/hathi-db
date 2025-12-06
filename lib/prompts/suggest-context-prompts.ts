import {
    CONTEXT_DEFINITION,
    CONTEXT_FORMAT_RULES,
    CONTEXT_EXAMPLES,
} from "./context-definitions";

/**
 * Generates a system prompt that defines context suggestion behavior and guidelines.
 * @returns A formatted string prompt with context suggestion rules.
 */
export function suggestContextSystemPrompt(): string {
    return `You are a context suggestion assistant that analyzes note content and suggests relevant organizational contexts (tags/categories).

${CONTEXT_DEFINITION}

**Context Selection Guidelines:**
1. **First Priority**: Reuse existing contexts when relevant
2. **Second Priority**: Extract proper nouns, named entities, specific topics, or concrete themes from the note
3. **Third Priority**: Suggest general but concrete categories (work, personal, health, finance, family, travel, learning, projects)

${CONTEXT_FORMAT_RULES}
- Maximum 5 contexts per note
- Each context should be a noun or noun phrase that could stand alone as a knowledge graph node

**Critical Response Format:**
- You MUST respond with ONLY a valid JSON array of strings
- Do NOT include markdown code blocks (no \`\`\`json or \`\`\`)
- Do NOT include explanations, comments, or additional text
- Do NOT use any formatting other than plain JSON
- The response must be parseable by JSON.parse()
- Return contexts in Title Case with spaces (e.g., "Project Alpha", "Machine Learning")

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
            ? contextsList.map((ctx) => `- ${ctx}`).join("\n")
            : "No existing contexts available";

    const prompt = `Analyze this note content and suggest 1-5 relevant contexts:

NOTE CONTENT:
"${content}"

EXISTING CONTEXTS (prioritize reusing these):
${contextsListString}

Remember:
- Only suggest concrete entities, topics, or named concepts that could be nodes in a knowledge graph
- Do NOT suggest adjectives, verbs, or abstract modifiers
- Prioritize reusing existing contexts when relevant
- Return contexts in Title Case with spaces (e.g., "Project Alpha", not "project-alpha")
- Return ONLY a JSON array of strings, no additional text`;

    return prompt.trim();
}
