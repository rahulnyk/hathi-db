import { EditorPlugin } from "./types";
import { setChatMode } from "@/store/uiSlice";

/**
 * Command Trigger Plugin
 *
 * Triggers chat mode when the user types '/' at the beginning of an empty
 * text field. This plugin only activates in create mode (when not editing an
 * existing note).
 *
 * Chat mode allows users to interact with AI by typing queries prefixed with
 * a forward slash.
 *
 * Conditions for triggering:
 * 1. Not in edit mode (only works when creating new notes)
 * 2. User types '/' character
 * 3. Cursor is at position 0
 * 4. Content is empty
 *
 * @param event - The keyboard event
 * @param context - Current editor context
 * @returns Plugin result indicating chat mode was triggered
 *
 * @example
 * User types: / (at start of empty field)
 * Result: Chat mode is activated via Redux dispatch
 */
export const commandTriggerPlugin: EditorPlugin = (event, context) => {
    const { content, cursorPosition, dispatch, isEditMode } = context;

    // Only trigger in create mode (not when editing existing notes)
    if (isEditMode) {
        return { continue: true };
    }

    // Check if user typed '/' at the beginning of empty content
    if (event.key === "/" && cursorPosition === 0 && content === "") {
        // Dispatch Redux action to enable chat mode
        dispatch(setChatMode(true));

        return {
            continue: true,
            preventDefault: false,
        };
    }

    // Not a command trigger, continue chain
    return { continue: true };
};
