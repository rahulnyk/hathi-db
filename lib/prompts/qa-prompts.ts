/**
 * Formats an array of notes into a structured JSON string for AI context.
 *
 * This function takes a list of `EnhancedNote` objects and transforms them into a
 * human-readable, pretty-printed JSON string. It selects key fields from each note,
 * adds formatted creation dates (`toISOString` and `toLocaleDateString`), and ensures
 * that optional fields have default values. The resulting string is designed to be
 * passed as part of a prompt to an AI model, providing it with the necessary
 * context to answer questions based on the user's notes.
 *
 * @param notes - The array of `EnhancedNote` objects to be formatted.
 * @returns A pretty-printed JSON string representing the provided notes, ready for inclusion in an AI prompt.
 */
import type { Note } from "@/store/notesSlice";

interface EnhancedNote
    extends Pick<
        Note,
        | "id"
        | "content"
        | "key_context"
        | "contexts"
        | "tags"
        | "note_type"
        // | "suggested_contexts"
        | "created_at"
    > {}

export function qaSystemPrompt(): string {
    return `You are an intelligent assistant helping a user answer questions based on their personal notes and knowledge base.

Your role:
- Analyze the user's question and the provided structured notes data
- Provide accurate, helpful answers based on the available information
- Leverage the rich metadata (contexts, tags, note types) for better understanding
- Maintain a conversational and helpful tone
- Synthesize information from multiple notes when relevant

Guidelines:
- Use ONLY the provided notes data to answer questions
- Pay attention to metadata like key_context, tags, note_type, and suggested_contexts
- Prioritize notes with relevant contexts and tags that match the question intent
- Distinguish between different note types (todos vs notes vs other types)
- Be specific and cite relevant information when possible
- If you can't find relevant information, say so clearly and suggest what to ask instead
- Don't make up information that's not in the notes
- Organize your response in a clear, readable format
- Include references to dates, contexts, or other identifying information to help the user locate relevant notes
- Do NOT include note IDs in your response text - the system will automatically provide clickable source links
- Focus on the content and context rather than technical identifiers
- When referencing specific notes, use descriptive information like dates, contexts, or key phrases instead of IDs`;
}

export function qaUserPrompt(
    question: string,
    notesContext: string,
    userContexts: string[]
): string {
    const contextsText =
        userContexts.length > 0
            ? `\n\nUser's frequently used contexts: ${userContexts.join(", ")}`
            : "";

    return `Question: ${question}

Available Notes Data (structured JSON format):
${notesContext}${contextsText}

Please answer the question based on the available structured information from the notes. Use the metadata (contexts, tags, note_type, etc.) to provide more intelligent and relevant answers. When referencing specific notes, use descriptive information like dates, contexts, or key content phrases rather than technical note IDs. The system will automatically provide clickable source references.`;
}

export function formatNotesForContext(notes: EnhancedNote[]): string {
    return JSON.stringify(
        notes.map((note) => ({
            id: note.id,
            content: note.content,
            key_context: note.key_context || null,
            contexts: note.contexts || [],
            tags: note.tags || [],
            note_type: note.note_type || "note",
            // suggested_contexts: note.suggested_contexts || [],
            // date_created: new Date(note.created_at).toISOString(),
            date_created_readable: new Date(
                note.created_at
            ).toLocaleDateString(),
        })),
        null,
        2
    );
}
