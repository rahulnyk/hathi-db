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
            You are a helpful assistant who is provided with a Users note: "${content}".
            Your task is to reads the note and suggests 1-5 possible "contexts" or topics that the note could be about.
            Contexts are like tags or categories that help organize notes. You should suggest contexts for the given note based on the following priority:
            Priority 1: Named entities mentioned in the note are the most important contexts for the note.
            Priority 2: User's existing contexts: ${contextsListString}
            Priority 3: Any other context that you can suggest relevant to the content of the note, for example, "work", "meeting-notes", "project-alpha", "ideas", "personal", "health", "finance", "family", "travel", "learn", "entertainment", "personal-development", "self-learning", "actionable-todos", "someday-todos", "upskill", "self-notes", "fitness"
            If the note is short, it may be ok to suggest 1 or 2 contexts only.
            Remember!! Never suggest more than 5 contexts for a single note - it is really important!
            Your response should be a JSON array of strings. Example: ["project-a", "meeting-notes", "grocery-list"]
            Please respond with a valid JSON array of strings only, without any additional text or explanations.
            Example response format:
            {
                "suggestions": ["work", "meeting-notes", "project-alpha", "ideas", "personal", "health", "finance", "family", "travel", "learn", "entertainment", "personal-development", "self-learning", "actionable-todos", "someday-todos", "upskill", "self-notes", "fitness"]
            }
        `;
    // console.log("Suggest Context User Prompt:", prompt);
    return prompt.trim();
}

export function suggestContextSystemPrompt(): string {
    return `
            You are a helpful assistant that suggests relevant contexts for notes based on their content and the user's existing context patterns.
            Always respond with valid JSON arrays of strings.
        `;
}
