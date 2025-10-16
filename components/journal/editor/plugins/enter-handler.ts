import { EditorPlugin } from "./types";

/**
 * Enter Handler Plugin
 *
 * Handles Enter key behavior differently based on edit mode:
 *
 * **Edit Mode (editing existing note):**
 * - Enter: Adds new line (allows multi-line editing)
 * - Shift+Enter: Adds new line (same as Enter)
 *
 * **Create Mode (creating new note):**
 * - Enter (without Shift): Submits form (stops chain)
 * - Shift+Enter: Adds new line (continues chain)
 *
 * This plugin should typically be placed at the end of the plugin chain
 * as it stops propagation when Enter is pressed in create mode.
 *
 * @param event - The keyboard event
 * @param context - Current editor context
 * @returns Plugin result that stops chain if Enter should trigger submission
 *
 * @example
 * // Create mode:
 * User types: Enter → Form submits
 * User types: Shift+Enter → New line is added
 *
 * @example
 * // Edit mode:
 * User types: Enter → New line is added
 * User types: Shift+Enter → New line is added
 */
export const enterHandlerPlugin: EditorPlugin = (event, context) => {
    // Check if Enter key is pressed
    if (event.key === "Enter") {
        const { isEditMode, content, isSubmitting } = context;

        // In edit mode, always allow new lines (both Enter and Shift+Enter)
        if (isEditMode) {
            return { continue: true };
        }

        // In create mode, handle Enter vs Shift+Enter differently
        if (!event.shiftKey) {
            // Enter without Shift: trigger submission
            if (content.trim() && !isSubmitting) {
                // Stop plugin chain and prevent default to trigger form submission
                // We need to manually trigger the form submission since we're in a textarea
                event.preventDefault();

                // Get the form element and submit it
                const textarea = context.textareaRef.current;
                if (textarea) {
                    const form = textarea.closest("form");
                    if (form) {
                        // Trigger form submission with fallback for older browsers
                        if (typeof form.requestSubmit === "function") {
                            form.requestSubmit();
                        } else {
                            form.submit();
                        }
                    }
                }

                return {
                    continue: false,
                    preventDefault: true,
                };
            }

            // Empty content or already submitting, prevent default but don't submit
            return {
                continue: false,
                preventDefault: true,
            };
        }

        // Shift+Enter in create mode: allow new line
        return { continue: true };
    }

    // Any other key, continue chain
    return { continue: true };
};
