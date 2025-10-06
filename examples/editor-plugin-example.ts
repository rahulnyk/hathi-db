/**
 * Example Plugin using Redux-based Editor State
 *
 * This demonstrates how external plugins can now access and modify
 * the editor state through Redux instead of being tightly coupled
 * to the component's local state.
 */

import { useAppDispatch, useAppSelector } from "@/store";
import {
    selectContextBracketInfo,
    selectDateTriggerInfo,
    selectActiveSelection,
    createEditorActions,
    shouldShowContextSuggestions,
    shouldShowDatePicker,
    type ContextBracketInfo,
    type DateTriggerInfo,
    type ActiveSelection,
} from "@/lib/editor-utils";

export function useEditorPlugin() {
    const dispatch = useAppDispatch();
    const contextBracketInfo = useAppSelector(selectContextBracketInfo);
    const dateTriggerInfo = useAppSelector(selectDateTriggerInfo);
    const activeSelection = useAppSelector(selectActiveSelection);
    const chatMode = useAppSelector((state) => state.ui.chatMode);

    // Create action creators bound to current dispatch
    const editorActions = createEditorActions(dispatch);

    // Plugin functionality examples:

    const handleCustomCommand = () => {
        // Plugin can directly manipulate editor state
        editorActions.setActiveSelection({ start: 0, end: 10 });
        editorActions.closeContextSuggestions();
    };

    const checkShouldShowUI = () => {
        // Plugin can use utility functions to determine UI state
        const showContextSuggestions = shouldShowContextSuggestions(
            contextBracketInfo,
            chatMode,
            dateTriggerInfo
        );

        const showDatePicker = shouldShowDatePicker(dateTriggerInfo, chatMode);

        return { showContextSuggestions, showDatePicker };
    };

    const insertTextAtCursor = (
        text: string,
        content: string,
        setContent: (content: string) => void
    ) => {
        // Plugin can work with current selection
        const { start, end } = activeSelection;
        const before = content.substring(0, start);
        const after = content.substring(end);
        const newContent = before + text + after;

        setContent(newContent);

        // Update selection to end of inserted text
        editorActions.setActiveSelection({
            start: start + text.length,
            end: start + text.length,
        });
    };

    const resetEditorToInitialState = () => {
        // Plugin can reset all editor state
        editorActions.resetEditorState();
    };

    return {
        // State
        contextBracketInfo,
        dateTriggerInfo,
        activeSelection,

        // Actions
        ...editorActions,

        // Helper functions
        checkShouldShowUI,
        insertTextAtCursor,
        resetEditorToInitialState,
        handleCustomCommand,
    };
}

// Example of a command processor that uses Redux state
export function processCustomEditorCommand(
    content: string,
    dispatch: ReturnType<typeof useAppDispatch>
) {
    const actions = createEditorActions(dispatch);

    // Example: /clear command resets editor state
    if (content.trim() === "/clear") {
        actions.resetEditorState();
        return true; // Command was processed
    }

    // Example: /focus command sets selection to start
    if (content.trim() === "/focus") {
        actions.setActiveSelection({ start: 0, end: 0 });
        return true;
    }

    return false; // Command not processed
}
