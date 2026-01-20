/**
 * Utility functions for detecting and managing note types
 */

// import { NoteType } from "@/store/notesSlice";
import { NoteType } from "@/db/types";
/**
 * Keywords and patterns that indicate a todo/task note
 */
const TODO_KEYWORDS = [
    "todo",
    "task",
    "remember",
    "remind",
    "need to",
    "have to",
    "must",
    "should",
    "action item",
    "action",
    "follow up",
    "followup",
    "check",
    "review",
    "schedule",
    "book",
    "call",
    "email",
    "contact",
    "buy",
    "purchase",
    "get",
    "pick up",
    "pickup",
    "finish",
    "complete",
    "submit",
    "send",
    "prepare",
    "organize",
    "plan",
];

/**
 * Patterns that indicate todo items (using regex for more flexible matching)
 */
const TODO_PATTERNS = [
    /^(?:to\s+)?do\b/i, // "do", "to do"
    /^(?:i\s+)?(?:need|have|must|should)\s+to\b/i, // "I need to", "need to", "have to", etc.
    /^(?:don't\s+)?forget\s+to\b/i, // "forget to", "don't forget to"
    /^(?:make\s+)?sure\s+to\b/i, // "make sure to", "sure to"
    /^remind\s+me\s+to\b/i, // "remind me to"
    /^remember\s+to\b/i, // "remember to"
    /^\[\s*\]\s/, // "[ ] " - checkbox format
    /^-\s*\[\s*\]\s/, // "- [ ]" - markdown todo format
    /^\*\s*\[\s*\]\s/, // "* [ ]" - markdown todo format
    /^\d+\.\s*\[\s*\]\s/, // "1. [ ]" - numbered todo format
];

/**
 * Detects if a given content string represents a todo/task item
 * @param content The note content to analyze
 * @returns true if the content appears to be a todo item
 */
export function isTodoContent(content: string): boolean {
    if (!content || typeof content !== "string") {
        return false;
    }

    const trimmedContent = content.trim();

    // Empty content is not a todo
    if (!trimmedContent) {
        return false;
    }

    // Check against regex patterns first (more specific and handles multi-word phrases)
    for (const pattern of TODO_PATTERNS) {
        if (pattern.test(trimmedContent)) {
            return true;
        }
    }

    // Check if content starts with any single-word todo keywords
    const lowerContent = trimmedContent.toLowerCase();
    for (const keyword of TODO_KEYWORDS) {
        if (lowerContent.startsWith(keyword.toLowerCase())) {
            // Make sure it's a word boundary (not part of a larger word)
            const nextChar = lowerContent.charAt(keyword.length);
            if (
                !nextChar ||
                /\s/.test(nextChar) ||
                /[:\-.,!?]/.test(nextChar)
            ) {
                return true;
            }
        }
    }

    // Check for common todo phrases anywhere in the first line
    const firstLine = lowerContent.split("\n")[0];
    const todoPhrasesInContent = [
        "remind me to",
        "remember to",
        "don't forget",
        "dont forget",
        "need to do",
        "have to do",
        "action item:",
        "follow up on",
        "make sure to",
    ];

    for (const phrase of todoPhrasesInContent) {
        if (firstLine.includes(phrase)) {
            return true;
        }
    }

    return false;
}

/**
 * Determines the appropriate note type based on content
 * @param content The note content to analyze
 * @param explicitType Optional explicitly provided note type
 * @returns The determined note type
 */
export function determineNoteType(
    content: string,
    explicitType?: NoteType,
): NoteType {
    // If an explicit type is provided and it's not null, use it
    if (explicitType && explicitType !== null) {
        return explicitType;
    }

    // Auto-detect based on content
    if (isTodoContent(content)) {
        return "todo";
    }

    // Default to regular note
    return "note";
}

/**
 * Extracts the main task description from todo content by removing common prefixes
 * @param content The todo content
 * @returns Cleaned task description
 */
export function cleanTodoContent(content: string): string {
    if (!content) return content;

    let cleaned = content.trim();

    // Remove common checkbox formats
    cleaned = cleaned.replace(/^[-*]\s*\[\s*\]\s*/, "");
    cleaned = cleaned.replace(/^\d+\.\s*\[\s*\]\s*/, "");
    cleaned = cleaned.replace(/^\[\s*\]\s*/, "");

    // Remove common todo prefixes (case insensitive)
    const prefixPatterns = [
        /^todo:?\s*/i,
        /^task:?\s*/i,
        /^remember\s+to\s*/i,
        /^remember:?\s*/i,
        /^remind\s+me\s+to\s*/i,
        /^remind\s+me:?\s*/i,
        /^(?:i\s+)?(?:need|have|must|should)\s+to\s*/i,
        /^(?:don't\s+)?forget\s+to\s*/i,
        /^(?:make\s+)?sure\s+to\s*/i,
        /^action\s+item:?\s*/i,
        /^follow\s+up:?\s*/i,
        /^(?:to\s+)?do:?\s*/i,
    ];

    for (const pattern of prefixPatterns) {
        cleaned = cleaned.replace(pattern, "");
    }

    return cleaned.trim();
}
