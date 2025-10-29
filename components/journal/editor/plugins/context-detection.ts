import {
    EditorPlugin,
    // EditorPluginContext
} from "./types";
import {
    openSuggestionBox,
    closeSuggestionBox,
    setQuery,
} from "@/store/contextSuggestionSlice";
import { findContextBrackets } from "@/lib/bracketMatchUtils";
import { getEditorId } from "./helpers";

/**
 * Context Detection Plugin
 *
 * Detects when the user is typing between [[ ]] brackets and manages
 * the context suggestion box state accordingly.
 *
 * Behavior:
 * - Opens suggestion box when user types after [[
 * - Updates query as user types between brackets
 * - Closes suggestion box when cursor moves outside brackets
 * - Handles edge case of typing space as first character
 *
 * @param event - The keyboard event
 * @param context - Current editor context
 * @returns Plugin result
 *
 * @example
 * User types: [[examp|]]
 * Result: Opens suggestion box with query "examp"
 */
export const contextDetectionPlugin: EditorPlugin = (event, context) => {
    const { content, cursorPosition, dispatch } = context;

    // Get consistent editor ID
    const editorId = getEditorId(context);

    // Don't process if we're just navigating
    if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "Enter" ||
        event.key === "Escape"
    ) {
        return { continue: true };
    }

    // Find the position of [[ before the cursor
    const match = findContextBrackets(content, cursorPosition);

    if (match.found && match.bracketStartPos !== undefined) {
        // User is inside [[ ... | (with or without closing ]])
        const queryText = match.query || "";

        // Open the suggestion box to help user complete the context
        dispatch(
            openSuggestionBox({
                editorId,
                bracketStartPosition: match.bracketStartPos + 2, // +2 to skip [[
            })
        );

        // Update the query (will be empty on first char after [[)
        dispatch(setQuery({ editorId, query: queryText }));
    } else {
        // Cursor is not inside [[ ]], close the suggestion box
        dispatch(closeSuggestionBox(editorId));
    }

    return { continue: true };
};
