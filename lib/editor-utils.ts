import { RootState, AppDispatch } from "@/store";
import {
    setContextBracketInfo,
    setDateTriggerInfo,
    setActiveSelection,
    resetEditorState,
    type ContextBracketInfo,
    type DateTriggerInfo,
    type ActiveSelection,
} from "@/store/editorSlice";

// Selectors for accessing editor state
export const selectContextBracketInfo = (
    state: RootState
): ContextBracketInfo => state.editor.contextBracketInfo;

export const selectDateTriggerInfo = (state: RootState): DateTriggerInfo =>
    state.editor.dateTriggerInfo;

export const selectActiveSelection = (state: RootState): ActiveSelection =>
    state.editor.activeSelection;

export const selectEditorState = (state: RootState) => state.editor;

export const selectChatMode = (state: RootState): boolean => state.ui.chatMode;

// Action creators for plugins to use
export const createEditorActions = (dispatch: AppDispatch) => ({
    setContextBracketInfo: (info: ContextBracketInfo) =>
        dispatch(setContextBracketInfo(info)),

    setDateTriggerInfo: (info: DateTriggerInfo) =>
        dispatch(setDateTriggerInfo(info)),

    setActiveSelection: (selection: ActiveSelection) =>
        dispatch(setActiveSelection(selection)),

    resetEditorState: () => dispatch(resetEditorState()),

    // Helper to close context suggestions
    closeContextSuggestions: () =>
        dispatch(
            setContextBracketInfo({
                isInsideBrackets: false,
                searchTerm: "",
                startPosition: -1,
                endPosition: -1,
            })
        ),

    // Helper to close date picker
    closeDatePicker: () =>
        dispatch(
            setDateTriggerInfo({
                isTriggerFound: false,
                triggerPosition: -1,
                triggerChar: "",
            })
        ),
});

// Utility for plugins to check if context suggestions should be shown
export const shouldShowContextSuggestions = (
    contextBracketInfo: ContextBracketInfo,
    chatMode: boolean,
    dateTriggerInfo: DateTriggerInfo
): boolean => {
    return (
        !chatMode &&
        contextBracketInfo.isInsideBrackets &&
        contextBracketInfo.searchTerm.length >= 2 &&
        !dateTriggerInfo.isTriggerFound
    );
};

// Utility for plugins to check if date picker should be shown
export const shouldShowDatePicker = (
    dateTriggerInfo: DateTriggerInfo,
    chatMode: boolean
): boolean => {
    return !chatMode && dateTriggerInfo.isTriggerFound;
};

// Re-export types for external modules
export type { ContextBracketInfo, DateTriggerInfo, ActiveSelection };
