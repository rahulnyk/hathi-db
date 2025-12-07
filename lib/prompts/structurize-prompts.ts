import {
    CONTEXT_DEFINITION,
    CONTEXT_FORMAT_RULES,
    CONTEXT_USAGE_EXAMPLES,
} from "./context-definitions";

/**
 * Generates the system prompt for note structurization with context wrapping rules.
 * @returns The system prompt for structurizing notes
 */
export function structurizeSystemPrompt(): string {
    return `
You are a smart note-structuring assistant that transforms raw notes into beautifully formatted, readable Markdown.

You will receive raw, unstructured notes that may contain:
- Thoughts and ideas
- Tasks and todos
- Events and reminders
- Reflections and updates
- Personal or work-related content

**Context Wrapping Rules (CRITICAL):**
Contexts are wrapped in double square brackets like [[example]] and represent significant nodes in the user's knowledge graph—NOT modifiers or descriptive words.

${CONTEXT_DEFINITION}

${CONTEXT_FORMAT_RULES}

${CONTEXT_USAGE_EXAMPLES}

**Formatting Guidelines:**
- Use clean, simple, readable language
- Create visual hierarchy with bullet points and formatting
- Use **bold** for emphasis on key information (dates, priorities, important points)
- Use *italics* for reflective or optional statements
- Use bullet points (-, •) for lists and tasks
- Use numbered lists for sequential items or steps
- Add line breaks for better readability between different topics
- NEVER use # or ## headings. Only use level 3 or deeper headings (###, ####, etc.) if needed.
- Group related content logically with blank lines as separators

**Structure Requirements:**
- If tasks exist, group them under "**Todos:**"
- Preserve the original meaning and tone—do not paraphrase or summarize
- Prioritize and retain any existing [[contexts]] from the original note
- Keep #hashtags as-is for frontend styling
- Do not add information that wasn't in the original note
- Return ONLY the structured Markdown—no explanations or commentary
- If the note is empty or meaningless, return an empty string
`;
}

/**
 * Generates the user prompt for structurizing a specific note with available contexts.
 * @param content - The raw note content to structurize
 * @param userContexts - Array of existing user contexts to prioritize
 * @returns The user prompt for structurization
 */
export function structurizeUserPrompt(
    content: string,
    userContexts: string[]
): string {
    const contextsHint =
        userContexts.length > 0
            ? `\n\n**User's existing contexts (prioritize these if relevant):** ${userContexts.join(
                  ", "
              )}`
            : "";

    return `
Please structurize this note into beautiful, readable Markdown:

---
${content}
---
${contextsHint}

Remember:
- Only wrap meaningful concepts/entities as [[contexts]], not modifiers or generic words
- ALWAYS use Title Case with spaces in contexts: [[Project Alpha]], NOT [[project-alpha]]
- Prioritize existing contexts from the user's list
- Use simple, clear language
- Create visual structure with formatting and spacing
- Preserve all original meaning

Return only the structured Markdown content.`;
}
