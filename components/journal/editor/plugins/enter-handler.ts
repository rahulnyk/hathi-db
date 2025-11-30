import { EditorPlugin } from "./types";

/**
 * Enter Handler Plugin
 *
 * Handles Enter key behavior based on edit mode and user preferences:
 *
 * **Edit Mode (editing existing note):**
 * - Enter: Always adds new line (allows multi-line editing)
 * - Shift+Enter: Always adds new line (same as Enter)
 *
 * **Create Mode (creating new note):**
 * The behavior depends on the user's "Enter to Submit" preference:
 *
 * When "Enter to Submit" is ENABLED (default):
 * - Enter (without Shift): Submits form (stops chain)
 * - Shift+Enter: Adds new line (continues chain)
 *
 * When "Enter to Submit" is DISABLED:
 * - Enter (without Shift): Adds new line (continues chain)
 * - Shift+Enter: Submits form (stops chain)
 *
 * This plugin should typically be placed at the end of the plugin chain
 * as it stops propagation when Enter should trigger submission.
 *
 * @param event - The keyboard event
 * @param context - Current editor context (includes enterToSubmit preference)
 * @returns Plugin result that stops chain if Enter should trigger submission
 *
 * @example
 * // Create mode with "Enter to Submit" ENABLED:
 * User types: Enter → Form submits
 * User types: Shift+Enter → New line is added
 *
 * @example
 * // Create mode with "Enter to Submit" DISABLED:
 * User types: Enter → New line is added
 * User types: Shift+Enter → Form submits
 *
 * @example
 * // Edit mode (preference doesn't matter):
 * User types: Enter → New line is added
 * User types: Shift+Enter → New line is added
 */
export const enterHandlerPlugin: EditorPlugin = (event, context) => {
    // Check if Enter key is pressed
    if (event.key === "Enter") {
        const { isEditMode, content, isSubmitting, enterToSubmit } = context;

        // In edit mode, always allow new lines (both Enter and Shift+Enter)
        if (isEditMode) {
            return { continue: true };
        }

        // In create mode, handle Enter vs Shift+Enter based on user preference
        const shouldSubmit = enterToSubmit
            ? !event.shiftKey // If enterToSubmit is true: Enter submits, Shift+Enter adds newline
            : event.shiftKey; // If enterToSubmit is false: Shift+Enter submits, Enter adds newline

        if (shouldSubmit) {
            // Trigger submission
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

        // Add new line (the opposite action)
        return { continue: true };
    }

    // Any other key, continue chain
    return { continue: true };
};

