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

    const prompt = `Analyze this note content and suggest 1-5 relevant contexts for organization:

NOTE CONTENT:
"${content}"

EXISTING CONTEXTS TO CONSIDER:
${contextsListString}

CONTEXT SELECTION GUIDELINES:
1. Prioritize reusing existing contexts when relevant
2. Extract specific named entities, topics, or themes from the note
3. Consider general categories: work, personal, health, finance, family, travel, learning, projects, etc.
4. Use lowercase, hyphenated format (e.g., "meeting-notes", "health-tracking")
5. Be specific but not overly narrow
6. Maximum 5 contexts

RESPONSE FORMAT:
Return ONLY a JSON array of strings. No explanations, no markdown, no additional text.

Examples:
["work", "meeting-notes"]
["personal", "health"]
["finance", "tax-planning", "2025"]`;

    return prompt.trim();
}

export function suggestContextSystemPrompt(): string {
    return `You are a context suggestion assistant that analyzes note content and suggests relevant organizational contexts (tags/categories).

CRITICAL INSTRUCTIONS:
- You MUST respond with ONLY a valid JSON array of strings
- Do NOT include any markdown code blocks (no \`\`\`json or \`\`\`)
- Do NOT include any explanations, comments, or additional text
- Do NOT use any formatting other than plain JSON
- The response must be parseable by JSON.parse()

Examples of correct responses:
["work", "meeting-notes"]
["personal", "health", "fitness"]
["finance", "budgeting", "taxes"]

Your entire response must be the JSON array and nothing else.`;
}
