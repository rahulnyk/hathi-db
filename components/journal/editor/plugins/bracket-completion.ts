import { EditorPlugin, BRACKET_PAIRS } from "./types";

/**
 * Bracket Completion Plugin
 *
 * Automatically inserts the closing bracket, quote, or parenthesis when an
 * opening character is typed. The cursor is positioned between the pair,
 * allowing immediate continued typing.
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
 * @returns Plugin result with updated content and cursor position if bracket was completed
 *
 * @example
 * User types: (
 * Result: (|)  (cursor at |)
 */
export const bracketCompletionPlugin: EditorPlugin = (event, context) => {
    const { content, cursorPosition } = context;
    const char = event.key;

    // Check if the typed character has a bracket pair
    if (BRACKET_PAIRS[char]) {
        const before = content.slice(0, cursorPosition);
        const after = content.slice(cursorPosition);
        const closingChar = BRACKET_PAIRS[char];

        return {
            continue: true,
            preventDefault: true,
            updatedContent: `${before}${char}${closingChar}${after}`,
            updatedCursorPosition: cursorPosition + 1,
        };
    }

    // Not a bracket character, continue chain
    return { continue: true };
};
