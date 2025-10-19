import { EditorPlugin, BRACKET_PAIRS } from "./types";

/**
 * Bracket Wrap Plugin
 *
 * Automatically wraps selected text with bracket pairs when an opening bracket
 * is typed. This provides an intuitive way to wrap existing text in brackets,
 * quotes, or parentheses.
 *
 * The plugin:
 * 1. Detects when text is selected (selectionStart !== selectionEnd)
 * 2. Checks if an opening bracket character is typed
 * 3. Wraps the selected text with the bracket pair
 * 4. Maintains the selection around the wrapped text (excluding the brackets)
 *
 * By preserving the selection, users can apply multiple wrapping operations
 * in sequence. For example, typing `[` twice will result in `[[text]]`.
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
 * @returns Plugin result with wrapped content and maintained selection
 *
 * @example
 * Content: "hello |world|" (text "world" is selected)
 * User types: (
 * Result: "hello (|world|)" (text "world" still selected)
 *
 * @example
 * Content: "note |text| here" ("text" is selected)
 * User types: [ then [
 * Result: "note [[|text|]] here" ("text" still selected after both wraps)
 */
export const bracketWrapPlugin: EditorPlugin = (event, context) => {
    const { content, selectionStart, selectionEnd } = context;
    const char = event.key;

    // Check if text is selected
    const hasSelection = selectionStart !== selectionEnd;

    // Only proceed if there's a selection and the typed character is an opening bracket
    if (hasSelection && BRACKET_PAIRS[char]) {
        const before = content.slice(0, selectionStart);
        const selectedText = content.slice(selectionStart, selectionEnd);
        const after = content.slice(selectionEnd);
        const closingChar = BRACKET_PAIRS[char];

        // Wrap the selected text with the bracket pair
        const wrappedContent = `${before}${char}${selectedText}${closingChar}${after}`;

        // Maintain selection around the wrapped text (excluding the new brackets)
        // This allows multiple wrapping operations in sequence
        const newSelectionStart = selectionStart + 1; // After the opening bracket
        const newSelectionEnd = selectionStart + selectedText.length + 1; // Before the closing bracket

        return {
            continue: false, // Stop the chain to prevent bracket completion plugin from running
            preventDefault: true,
            updatedContent: wrappedContent,
            updatedSelectionStart: newSelectionStart,
            updatedSelectionEnd: newSelectionEnd,
        };
    }

    // No selection or not a bracket character, continue chain
    return { continue: true };
};
