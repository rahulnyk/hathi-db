// ============================================================================
// Context Bracket Utilities
// ============================================================================

/**
 * Regular expression pattern to match context brackets [[ ]] with content before cursor.
 * Matches: [[text before cursor
 * Groups: [1] = text between [[ and cursor
 */
export const CONTEXT_BRACKET_PATTERN = /\[\[([^\]]*?)$/;

/**
 * Context bracket markers used in the editor
 */
export const CONTEXT_BRACKET_OPEN = "[[";
export const CONTEXT_BRACKET_CLOSE = "]]";

/**
 * Result of finding context brackets around cursor position
 */
export interface ContextBracketMatch {
    /** Whether a context bracket pattern was found */
    found: boolean;
    /** The text between [[ and cursor position */
    query?: string;
    /** Position where [[ starts in the content */
    bracketStartPos?: number;
    /** Position where ]] starts after cursor, or -1 if not found */
    closingBracketPos?: number;
}

/**
 * Finds context bracket pattern around the cursor position.
 * Checks for [[ before cursor and ]] after cursor.
 *
 * @param content - The full text content
 * @param cursorPosition - Current cursor position
 * @returns ContextBracketMatch object with details about the match
 *
 * @example
 * ```typescript
 * const content = "Some text [[examp|]] more text";
 * const result = findContextBrackets(content, 15); // cursor at |
 * // result: { found: true, query: "examp", bracketStartPos: 10, closingBracketPos: 0 }
 * ```
 */
export function findContextBrackets(
    content: string,
    cursorPosition: number
): ContextBracketMatch {
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);

    // Look for [[ pattern before cursor
    const openBracketMatch = beforeCursor.match(CONTEXT_BRACKET_PATTERN);

    if (!openBracketMatch) {
        return { found: false };
    }

    // Calculate bracket start position
    const bracketStartPos = cursorPosition - openBracketMatch[0].length;
    const query = openBracketMatch[1];

    // Look for ]] after cursor
    const closingBracketPos = afterCursor.indexOf(CONTEXT_BRACKET_CLOSE);

    return {
        found: true,
        query,
        bracketStartPos,
        closingBracketPos,
    };
}

/**
 * Inserts a context label between [[ ]] brackets at the cursor position.
 * Replaces any existing text between the brackets with the new context.
 *
 * @param content - The full text content
 * @param cursorPosition - Current cursor position (should be between [[ ]])
 * @param contextLabel - The context label to insert
 * @returns Object with newContent and newCursorPosition, or null if brackets not found
 *
 * @example
 * ```typescript
 * const content = "Text [[old|]] more";
 * const result = insertContextInBrackets(content, 9, "new-context");
 * // result: { newContent: "Text [[new-context]] more", newCursorPosition: 20 }
 * ```
 */
export function insertContextInBrackets(
    content: string,
    cursorPosition: number,
    contextLabel: string
): { newContent: string; newCursorPosition: number } | null {
    const match = findContextBrackets(content, cursorPosition);

    if (!match.found || match.bracketStartPos === undefined) {
        return null;
    }

    // If no closing bracket found, can't insert
    if (
        match.closingBracketPos === undefined ||
        match.closingBracketPos === -1
    ) {
        return null;
    }

    // Build the new content
    const beforeBrackets = content.slice(0, match.bracketStartPos);
    const afterBrackets = content.slice(
        cursorPosition + match.closingBracketPos + CONTEXT_BRACKET_CLOSE.length
    );
    const newContent = `${beforeBrackets}${CONTEXT_BRACKET_OPEN}${contextLabel}${CONTEXT_BRACKET_CLOSE}${afterBrackets}`;

    // Position cursor after the inserted context and closing brackets
    const newCursorPosition =
        match.bracketStartPos +
        CONTEXT_BRACKET_OPEN.length +
        contextLabel.length +
        CONTEXT_BRACKET_CLOSE.length;

    return { newContent, newCursorPosition };
}
