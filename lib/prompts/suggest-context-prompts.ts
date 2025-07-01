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
            : "No existing contexts found";

    const prompt = `
Analyze this note: "${content}"

Suggest 1-5 relevant contexts (tags/categories) for organizing this note.

Priority:
1. Named entities from the note
2. Existing contexts: ${contextsListString}
3. General contexts: work, personal, health, finance, family, travel, learning, etc.

IMPORTANT: Return ONLY a valid JSON array of strings, nothing else.
Example: ["work", "meeting-notes"]
Max 5 contexts.`;
    
    return prompt.trim();
}

export function suggestContextSystemPrompt(): string {
    return `You suggest contexts for notes. You must return ONLY a valid JSON array of strings, no other text.`;
}
