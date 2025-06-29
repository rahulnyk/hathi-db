/**
 * Q&A prompts for answering questions based on user's notes
 */

/**
 * Q&A prompts for answering questions based on user's notes
 */

// Updated interface to match the enhanced data structure
interface EnhancedNote {
    id: string;
    content: string;
    key_context?: string;
    contexts?: string[];
    tags?: string[];
    note_type?: string;
    suggested_contexts?: string[];
    created_at: string;
}

export function qaSystemPrompt(): string {
    return `You are an intelligent assistant helping a user answer questions based on their personal notes and knowledge base.

Your role:
- Analyze the user's question and the provided structured notes data
- Provide accurate, helpful answers based on the available information
- Leverage the rich metadata (contexts, tags, note types) for better understanding
- Reference specific notes when relevant (by date, context, or type)
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
- Include references to specific concepts, contexts, or dates when relevant
- When referencing notes, mention the date, context, or tags to help the user locate them
- Use the structured metadata to provide more intelligent categorization and grouping of information`;
}

export function qaUserPrompt(question: string, notesContext: string, userContexts: string[]): string {
    const contextsText = userContexts.length > 0 
        ? `\n\nUser's frequently used contexts: ${userContexts.join(', ')}`
        : '';

    return `Question: ${question}

Available Notes Data (structured JSON format):
${notesContext}${contextsText}

Please answer the question based on the available structured information from the notes. Use the metadata (contexts, tags, note_type, etc.) to provide more intelligent and relevant answers. If you need to reference specific notes, please use the metadata to help the user locate them.`;
}

export function formatNotesForContext(notes: EnhancedNote[]): string {
    return JSON.stringify(
        notes.map(note => ({
            id: note.id,
            content: note.content,
            key_context: note.key_context || null,
            contexts: note.contexts || [],
            tags: note.tags || [],
            note_type: note.note_type || 'note',
            suggested_contexts: note.suggested_contexts || [],
            date_created: new Date(note.created_at).toISOString(),
            date_created_readable: new Date(note.created_at).toLocaleDateString()
        })),
        null,
        2
    );
}
