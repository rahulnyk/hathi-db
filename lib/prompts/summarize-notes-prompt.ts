import { Note } from "@/store/notesSlice";
export function summarizeNotesPrompt(
    notes: Note[],
    includeMetadata = true
): string {
    const notesContent = notes
        .map((note, index) => {
            let content = `Note ${index + 1}`;
            if (includeMetadata) {
                content += ` (${note.note_type || "note"})`;
                if (note.contexts?.length) {
                    content += ` [Contexts: ${note.contexts.join(", ")}]`;
                }
                content += ` (${new Date(
                    note.created_at
                ).toLocaleDateString()})`;
            }
            content += `:\n${note.content}\n\n`;
            return content;
        })
        .join("");

    return `Create an succinct summary of the following ${notes.length} notes. 
    
CRITICAL REQUIREMENTS:
- Maximum 3-4 bullet points per section
- Each bullet point should be ONE sentence maximum
- Focus on ONLY the most essential information
- Divide summary into sections like "At a Glance", "Action Items", "Key Takeaways"
- Use active, direct language as if conversing with the user.
- Perfect for a 30-second quick scan
- DO not repeat yourself. 
- Be as concise as possible.
- Do not add any explaination, unnecessary text, or filler content. KEEP IT BRIEF.

Notes to summarize:
${notesContent}
`;
}
