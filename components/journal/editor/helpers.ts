/**
 * Editor Helper Functions
 * Utility functions for text manipulation in the notes editor
 */

export const BRACKET_PAIRS: Record<string, string> = {
    "[": "]",
    "(": ")",
    "{": "}",
    "<": ">",
};

/**
 * Context bracket detection result
 */
export interface ContextBracketInfo {
    isInsideBrackets: boolean;
    searchTerm: string;
    startPosition: number;
    endPosition: number;
}

/**
 * Detects if the cursor is inside double square brackets [[]] and extracts search term
 * @param content - The full content of the editor
 * @param cursorPosition - Current cursor position
 * @returns Object with bracket detection info
 */
export function detectContextBrackets(
    content: string,
    cursorPosition: number
): ContextBracketInfo {
    // Look backwards for opening [[
    let openStart = -1;
    for (let i = cursorPosition - 1; i >= 0; i--) {
        if (content.substring(i, i + 2) === "[[") {
            openStart = i;
            break;
        }
        // Stop if we hit a closing ]] or newline
        if (content.substring(i, i + 2) === "]]" || content[i] === "\n") {
            break;
        }
    }

    // Look forwards for closing ]]
    let closeEnd = -1;
    for (let i = cursorPosition; i <= content.length - 2; i++) {
        if (content.substring(i, i + 2) === "]]") {
            closeEnd = i + 2;
            break;
        }
        // Stop if we hit an opening [[ or newline
        if (content.substring(i, i + 2) === "[[" || content[i] === "\n") {
            break;
        }
    }

    // Check if we found both opening and closing brackets
    if (openStart !== -1 && closeEnd !== -1) {
        const searchTerm = content.substring(openStart + 2, cursorPosition);
        return {
            isInsideBrackets: true,
            searchTerm,
            startPosition: openStart,
            endPosition: closeEnd,
        };
    }

    // Special case: Check if we're at the end of an incomplete bracket pair
    if (openStart !== -1 && closeEnd === -1) {
        const searchTerm = content.substring(openStart + 2, cursorPosition);
        return {
            isInsideBrackets: true,
            searchTerm,
            startPosition: openStart,
            endPosition: content.length, // Use content length as placeholder
        };
    }

    return {
        isInsideBrackets: false,
        searchTerm: "",
        startPosition: -1,
        endPosition: -1,
    };
}

/**
 * Replaces the content within context brackets with the selected context
 * @param content - The full content of the editor
 * @param bracketInfo - Information about the bracket position
 * @param selectedContext - The context to insert
 * @returns Object with new content and cursor position
 */
export function replaceContextInBrackets(
    content: string,
    bracketInfo: ContextBracketInfo,
    selectedContext: string
): { newContent: string; newCursorPosition: number } {
    const beforeBrackets = content.substring(0, bracketInfo.startPosition);
    // Ensure endPosition does not exceed content length
    const safeEndPosition = Math.min(bracketInfo.endPosition, content.length);
    const afterBrackets = content.substring(safeEndPosition);

    const newContent =
        beforeBrackets + `[[${selectedContext}]]` + afterBrackets;
    const newCursorPosition =
        beforeBrackets.length + `[[${selectedContext}]]`.length;

    return {
        newContent,
        newCursorPosition,
    };
}

/**
 * Handles bracket insertion by wrapping selection or creating empty pair
 * @param openingBracket - The opening bracket character
 * @param currentContent - Current content of the editor
 * @param selection - Current selection range
 * @param localBracketPairs - Map of opening to closing brackets
 * @returns Object with new value and selection positions
 */
export function handleBracketInsertion(
    openingBracket: string,
    currentContent: string,
    selection: { start: number; end: number },
    localBracketPairs: Record<string, string>
): { newValue: string; newSelectionStart: number; newSelectionEnd: number } {
    const closingBracket = localBracketPairs[openingBracket];

    const textBefore = currentContent.substring(0, selection.start);
    const selectedText = currentContent.substring(
        selection.start,
        selection.end
    );
    const textAfter = currentContent.substring(selection.end);

    const newValue =
        textBefore + openingBracket + selectedText + closingBracket + textAfter;

    let newSelectionStart: number;
    let newSelectionEnd: number;

    if (selectedText.length > 0) {
        // Text was selected, keep it selected
        newSelectionStart = selection.start + openingBracket.length;
        newSelectionEnd = newSelectionStart + selectedText.length;
    } else {
        // No text selected, cursor goes between brackets
        newSelectionStart = selection.start + openingBracket.length;
        newSelectionEnd = newSelectionStart; // Cursor, not a selection
    }

    return { newValue, newSelectionStart, newSelectionEnd };
}

/**
 * Handles auto-deletion of bracket pairs when backspacing
 * @param currentValue - Current content of the editor
 * @param cursorPosition - Current cursor position
 * @param charBeforeCursor - Character before the cursor
 * @param localBracketPairs - Map of opening to closing brackets
 * @returns Object with new value and cursor position, or null if no action needed
 */
export function handleAutoDeleteBracketPair(
    currentValue: string,
    cursorPosition: number,
    charBeforeCursor: string,
    localBracketPairs: Record<string, string>
): { newValue: string; newCursorPosition: number } | null {
    const expectedClosingBracket = localBracketPairs[charBeforeCursor];
    if (expectedClosingBracket) {
        const charAfterCursor = currentValue.substring(
            cursorPosition,
            cursorPosition + 1
        );
        if (charAfterCursor === expectedClosingBracket) {
            const textBeforePair = currentValue.substring(
                0,
                cursorPosition - 1
            );
            const textAfterPair = currentValue.substring(cursorPosition + 1);
            return {
                newValue: textBeforePair + textAfterPair,
                newCursorPosition: cursorPosition - 1,
            };
        }
    }
    return null;
}
