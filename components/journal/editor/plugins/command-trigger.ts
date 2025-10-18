import { EditorPlugin } from "./types";
import { setChatMode } from "@/store/uiSlice";

/**
 * Command Trigger Plugin
 *
 * Handles command shortcuts to toggle between chat mode and note-making mode.
 * This plugin only activates in create mode (when not editing an existing note).
 *
 * Supported commands:
 * - `qq`: Enter chat mode (for AI interactions)
 * - `nn`: Exit chat mode (return to note-making mode)
 *
 * Commands are triggered when:
 * 1. Not in edit mode (only works when creating new notes)
 * 2. User types the second character of a command sequence
 * 3. The previous character matches the first character of the command
 * 4. Content only contains the command characters
 *
 * @param event - The keyboard event
 * @param context - Current editor context
 * @returns Plugin result indicating whether a command was triggered
 *
 * @example
 * User types: qq (in empty field)
 * Result: Chat mode is activated, content is cleared
 *
 * @example
 * User types: nn (in chat mode)
 * Result: Note-making mode is activated, content is cleared
 */
export const commandTriggerPlugin: EditorPlugin = (event, context) => {
    const { content, cursorPosition, dispatch, isEditMode, chatMode } = context;

    // Only trigger in create mode (not when editing existing notes)
    if (isEditMode) {
        return { continue: true };
    }

    // Check for 'qq' command to enter chat mode
    if (
        event.key === "q" &&
        content === "q" &&
        cursorPosition === 1 &&
        !chatMode
    ) {
        // Enable chat mode
        dispatch(setChatMode(true));

        return {
            continue: true,
            preventDefault: true,
            updatedContent: "",
            updatedCursorPosition: 0,
        };
    }

    // Check for 'nn' command to exit chat mode and return to note-making
    if (
        event.key === "n" &&
        content === "n" &&
        cursorPosition === 1 &&
        chatMode
    ) {
        // Disable chat mode
        dispatch(setChatMode(false));

        return {
            continue: true,
            preventDefault: true,
            updatedContent: "",
            updatedCursorPosition: 0,
        };
    }

    // Not a command trigger, continue chain
    return { continue: true };
};
