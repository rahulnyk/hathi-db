/**
 * Q&A prompts for answering questions based on user's notes
 */

export function qaSystemPrompt(): string {
    return `You are an intelligent assistant helping a user answer questions based on their personal notes and knowledge base.

Your role:
- Analyze the user's question and the provided notes context
- Provide accurate, helpful answers based on the available information
- If the information is insufficient, clearly state what's missing
- Reference specific notes when relevant (by date or context)
- Maintain a conversational and helpful tone
- Synthesize information from multiple notes when relevant

Guidelines:
- Use ONLY the provided notes context to answer questions
- Be specific and cite relevant information when possible
- If you can't find relevant information, say so clearly and suggest what to ask instead
- Don't make up information that's not in the notes
- Organize your response in a clear, readable format
- Include references to specific concepts, contexts, or dates when relevant
- If multiple notes contain related information, synthesize them into a coherent answer
- When referencing notes, mention the date or context to help the user locate them`;
}

export function qaUserPrompt(question: string, notesContext: string, userContexts: string[]): string {
    const contextsText = userContexts.length > 0 
        ? `\n\nUser's known contexts: ${userContexts.join(', ')}`
        : '';

    return `Question: ${question}

Available Notes Context:
${notesContext}${contextsText}

Please answer the question based on the available information from the notes. If you need to reference specific notes or contexts, please do so clearly.`;
}

export function formatNotesForContext(notes: Array<{id: string, content: string, contexts?: string[], created_at: string}>): string {
    return notes.map(note => {
        const contexts = note.contexts?.length ? ` [Contexts: ${note.contexts.join(', ')}]` : '';
        const date = new Date(note.created_at).toLocaleDateString();
        return `--- Note (${date})${contexts} ---
${note.content}`;
    }).join('\n\n');
}
