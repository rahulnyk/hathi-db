/**
 * Generates a user prompt for extracting a deadline from a given text.
 * @param content The text content to analyze for a deadline.
 * @returns A formatted string prompt for deadline extraction.
 */
export function extractDeadlineUserPrompt(content: string): string {
    const prompt = `Extract a deadline from this text: "${content}"

Response format: YYYY-MM-DD or null`;

    return prompt.trim();
}

/**
 * Generates a system prompt for the AI when extracting deadlines.
 * @returns A system prompt string.
 */
export function extractDeadlineSystemPrompt(): string {
    return `You are a deadline extraction assistant that analyzes text content and extracts specific deadlines or due dates.

CRITICAL INSTRUCTIONS:
- You MUST respond with ONLY a date in YYYY-MM-DD format or the string "null"
- Do NOT include any explanations, comments, or additional text
- Do NOT use markdown formatting
- The response must be parseable and contain only the date or "null"

DATE EXTRACTION RULES:
1. Extract specific dates (e.g., "August 1st", "July 25", "2025-08-15")
2. Convert relative dates to absolute dates based on today's date: ${
        new Date().toISOString().split("T")[0]
    }
3. Handle relative terms: "tomorrow", "next Monday", "in 3 days", "end of week", "next month"
4. If no specific deadline is mentioned or it's too vague (e.g., "soon", "later", "eventually"), return "null"

EXAMPLES OF CORRECT RESPONSES:
- For "complete this by next Monday" (today is 2025-07-19, Saturday) -> 2025-07-21
- For "finish report in two weeks" (today is 2025-07-19) -> 2025-08-02
- For "submit by August 1st" -> 2025-08-01
- For "due tomorrow" (today is 2025-07-19) -> 2025-07-20
- For "get groceries" (no deadline) -> null
- For "need this done soon" (vague) -> null

Your entire response must be either a valid YYYY-MM-DD date or the string "null".`;
}
