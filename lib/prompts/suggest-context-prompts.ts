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

    const prompt = `Analyze this note content and suggest 1-5 relevant contexts for organising my notes:

NOTE CONTENT:
"${content}"

EXISTING CONTEXTS TO CONSIDER:
${contextsListString}

`;

    return prompt.trim();
}

export function suggestContextSystemPrompt(): string {
    return `You are a context suggestion assistant that analyzes note content and suggests relevant organizational contexts (tags/categories).

CONTEXT SELECTION GUIDELINES:
1. First Priority should be to reuse existing contexts when relevant
2. Second priority should be to extract person name, named entities, topics, or themes from the note.
3. Thirdly consider general categories: work, personal, health, finance, family, travel, learning, projects, etc.

CRITICAL INSTRUCTIONS:
- Maximum 6 contexts.
- Use lowercase, hyphenated format (e.g., "meeting-notes", "health-tracking")
- You MUST respond with ONLY a valid JSON array of strings
- Do NOT include any markdown code blocks (no \`\`\`json or \`\`\`)
- Do NOT include any explanations, comments, or additional text
- Do NOT use any formatting other than plain JSON
- The response must be parseable by JSON.parse()

Examples of correct responses:
["work", "meeting-notes"]
["personal", "health", "fitness"]
["finance", "budgeting", "taxes"]`;
}
