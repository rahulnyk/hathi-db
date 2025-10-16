import { EditorPlugin, BRACKET_PAIRS } from "./types";

/**
 * Bracket Deletion Plugin
 *
 * Automatically deletes the corresponding closing bracket when the opening
 * bracket is deleted using the Backspace key. This only works when:
 * 1. The Backspace key is pressed
 * 2. The character before the cursor is an opening bracket
 * 3. The character at the cursor is the corresponding closing bracket
 * 4. There are no characters between the opening and closing brackets
 *
 * This provides a symmetric deletion experience to match the bracket
 * completion behavior.
 *
 * Supported pairs:
 * - Parentheses: ( )
 * - Square brackets: [ ]
 * - Curly braces: { }
 * - Double quotes: " "
 * - Single quotes: ' '
 * - Backticks: ` `
 *
 * @param event - The keyboard event
 * @param context - Current editor context
 * @returns Plugin result with both brackets deleted if conditions are met
 *
 * @example
 * Content: "hello(|)" (cursor at |)
 * User presses: Backspace
 * Result: "hello|"
 *
 * @example
 * Content: "hello(x|)" (cursor at |)
 * User presses: Backspace
 * Result: "hello(|)" (only deletes 'x', keeps brackets)
 */
export const bracketDeletionPlugin: EditorPlugin = (event, context) => {
    // Only handle Backspace key
    if (event.key !== "Backspace") {
        return { continue: true };
    }

    const { content, cursorPosition } = context;

    // Need at least one character before cursor and one after
    if (cursorPosition === 0 || cursorPosition >= content.length) {
        return { continue: true };
    }

    // Get the character before cursor (being deleted) and after cursor
    const charBeforeCursor = content[cursorPosition - 1];
    const charAtCursor = content[cursorPosition];

    // Check if the character being deleted is an opening bracket
    // and the next character is its corresponding closing bracket
    if (
        BRACKET_PAIRS[charBeforeCursor] &&
        BRACKET_PAIRS[charBeforeCursor] === charAtCursor
    ) {
        // Delete both the opening and closing brackets
        const before = content.slice(0, cursorPosition - 1);
        const after = content.slice(cursorPosition + 1);

        return {
            continue: true,
            preventDefault: true,
            updatedContent: `${before}${after}`,
            updatedCursorPosition: cursorPosition - 1,
        };
    }

    // Not a bracket pair deletion, continue chain
    return { continue: true };
};
