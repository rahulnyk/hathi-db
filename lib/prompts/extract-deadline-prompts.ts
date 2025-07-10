/**
 * Generates a user prompt for extracting a deadline from a given text.
 * @param content The text content to analyze for a deadline.
 * @returns A formatted string prompt for deadline extraction.
 */
export function extractDeadlineUserPrompt(content: string): string {
    const prompt = `
Analyze the following text and extract a specific deadline or due date if one is mentioned:
"${content}"

If a specific date or relative future date (e.g., "next Friday", "in 3 days", "by end of week") is found,
convert it to an absolute date in YYYY-MM-DD format based on the current date of ${new Date().toISOString().split('T')[0]}.

CRITICAL:
- Return ONLY the date string in YYYY-MM-DD format if a deadline is found.
- If no specific deadline is mentioned, or if it's too vague (e.g., "soon"), return "null".
- Do not include any explanations, markdown, or other text.

Examples:
- Text: "todo complete this by next Monday" (assuming today is 2024-07-15, Monday) -> Response: "2024-07-22"
- Text: "todo finish report in two weeks" (assuming today is 2024-07-15) -> Response: "2024-07-29"
- Text: "todo get groceries" -> Response: "null"
- Text: "todo submit proposal by August 1st" -> Response: "2024-08-01"
- Text: "todo need this done by tomorrow" (assuming today is 2024-07-15) -> Response: "2024-07-16"
`;
    return prompt.trim();
}

/**
 * Generates a system prompt for the AI when extracting deadlines.
 * @returns A system prompt string.
 */
export function extractDeadlineSystemPrompt(): string {
    return "You are a deadline extraction tool. Your task is to identify a date from the user's text and return it in YYYY-MM-DD format. If no date is found, return the string \"null\". Do not provide any additional text or explanation.";
}
