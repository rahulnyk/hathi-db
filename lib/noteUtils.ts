import { sentenceCaseToSlug } from "./utils";
import { NoteType, Note } from "@/store/notesSlice";
import { v4 as uuidv4 } from "uuid";
/**
 * Extracts context slugs from note content.
 */
export function extractContexts(content: string): string[] {
    const contextRegex = /\[\[([^\]]+)\]\]/g;
    const contexts: string[] = [];
    let match;
    while ((match = contextRegex.exec(content)) !== null) {
        const context = match[1].trim();
        if (context) {
            contexts.push(sentenceCaseToSlug(context));
        }
    }
    return Array.from(new Set(contexts));
}

/**
 * Extracts hashtags from note content.
 */
export function extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
        const tag = match[1].trim();
        if (tag) {
            tags.push(tag.toLowerCase());
        }
    }
    return Array.from(new Set(tags));
}

/**
 * Extracts both contexts and tags from note content.
 */
export function extractMetadata(content: string): {
    contexts: string[];
    tags: string[];
} {
    return {
        contexts: extractContexts(content),
        tags: extractHashtags(content),
    };
}

/**
 * Creates an optimistic note object with generated metadata and unique identifier.
 *
 * An optimistic note is created immediately on the client-side before server confirmation,
 * allowing for responsive UI updates while the actual persistence operation is pending.
 *
 * @param content - The text content of the note
 * @param userId - The unique identifier of the user creating the note
 * @param currentContext - The primary context slug for the note, will be set as key_context
 * @param note_type - The type of note being created, defaults to "note"
 * @param contexts - Optional array of additional context slugs to associate with the note. currentContext will be added to this array.
 *                   If not provided, only the currentContext will be used.
 * @param tags - Optional array of tags to associate with the note
 * @returns A new Note object with generated ID, timestamps, and combined contexts
 *
 * @example
 * ```typescript
 * const note = createOptimisticNote(
 *   "This is my note content",
 *   "user-123",
 *   "meeting-notes",
 *   "note",
 *   ["work", "project"],
 *   ["important", "todo"]
 * );
 * ```
 */
export const createOptimisticNote = (
    content: string,
    userId: string,
    currentContext: string,
    note_type: NoteType = "note",
    contexts?: string[],
    tags?: string[]
): Note => {
    const now = new Date().toISOString();

    // Start with provided contexts or empty array, then add currentContext
    const contextArray = contexts || [];
    const allContexts = [...contextArray, currentContext];

    // Remove duplicates to ensure distinct values
    const distinctContexts = [...new Set(allContexts)];

    return {
        id: uuidv4(),
        content,
        created_at: now,
        user_id: userId,
        persistenceStatus: "pending",
        key_context: currentContext,
        contexts: distinctContexts,
        tags: tags || [],
        note_type,
    };
};
