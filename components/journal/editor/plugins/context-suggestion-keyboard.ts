import { EditorPlugin, EditorPluginContext } from "./types";
import {
    selectNext,
    selectPrevious,
    closeSuggestionBox,
} from "@/store/contextSuggestionSlice";
import {
    findContextBrackets,
    insertContextInBrackets,
} from "@/lib/bracketMatchUtils";
import { getEditorId } from "./helpers";

/**
 * Context Suggestion Keyboard Handler Plugin
 *
 * Handles keyboard events when the context suggestion box is active.
 *
 * Behavior:
 * - ArrowDown: Select next suggestion
 * - ArrowUp: Select previous suggestion
 * - Enter: Insert selected suggestion or first suggestion if none selected
 * - Escape: Close suggestion box
 *
 * This plugin should run BEFORE the enter handler plugin to intercept
 * Enter key when suggestions are active.
 *
 * @param event - The keyboard event
 * @param context - Current editor context
 * @returns Plugin result
 */
export const contextSuggestionKeyboardPlugin: EditorPlugin = (
    event,
    context
) => {
    const { dispatch, content, cursorPosition, suggestionBoxState } = context;

    // Get consistent editor ID
    const editorId = getEditorId(context);

    // Check if suggestion box is open
    if (!suggestionBoxState.isOpen) {
        return { continue: true };
    }

    const { selectedSuggestion, suggestions } = suggestionBoxState;

    switch (event.key) {
        case "ArrowDown":
            event.preventDefault();
            dispatch(selectNext(editorId));
            return { continue: false, preventDefault: true };

        case "ArrowUp":
            event.preventDefault();
            dispatch(selectPrevious(editorId));
            return { continue: false, preventDefault: true };

        case "Escape":
            event.preventDefault();
            dispatch(closeSuggestionBox(editorId));
            return { continue: false, preventDefault: true };

        case "Enter": {
            // Find the [[ ]] boundaries
            const match = findContextBrackets(content, cursorPosition);

            if (!match.found || match.closingBracketPos === -1) {
                // Not in context brackets or no closing bracket, let normal enter handler work
                return { continue: true };
            }

            event.preventDefault();

            // Determine which context to insert
            let contextToInsert = "";
            if (selectedSuggestion) {
                contextToInsert = selectedSuggestion.label;
            } else if (suggestions.length > 0) {
                // Use first suggestion if none selected
                contextToInsert = suggestions[0].label;
            } else {
                // No suggestions, close box and continue
                dispatch(closeSuggestionBox(editorId));
                return { continue: true };
            }

            // Insert the context using the utility function
            const result = insertContextInBrackets(
                content,
                cursorPosition,
                contextToInsert
            );

            if (!result) {
                // Shouldn't happen since we already validated, but handle gracefully
                dispatch(closeSuggestionBox(editorId));
                return { continue: true };
            }

            // Close the suggestion box
            dispatch(closeSuggestionBox(editorId));

            return {
                continue: false,
                preventDefault: true,
                updatedContent: result.newContent,
                updatedCursorPosition: result.newCursorPosition,
            };
        }

        default:
            return { continue: true };
    }
};
