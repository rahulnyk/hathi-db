import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ContextBracketInfo {
    isInsideBrackets: boolean;
    searchTerm: string;
    startPosition: number;
    endPosition: number;
}

export interface DateTriggerInfo {
    isTriggerFound: boolean;
    triggerPosition: number;
    triggerChar: string;
}

export interface ActiveSelection {
    start: number;
    end: number;
}

export interface EditorState {
    contextBracketInfo: ContextBracketInfo;
    dateTriggerInfo: DateTriggerInfo;
    activeSelection: ActiveSelection;
}

const initialState: EditorState = {
    contextBracketInfo: {
        isInsideBrackets: false,
        searchTerm: "",
        startPosition: -1,
        endPosition: -1,
    },
    dateTriggerInfo: {
        isTriggerFound: false,
        triggerPosition: -1,
        triggerChar: "",
    },
    activeSelection: {
        start: 0,
        end: 0,
    },
};

const editorSlice = createSlice({
    name: "editor",
    initialState,
    reducers: {
        setContextBracketInfo(
            state,
            action: PayloadAction<ContextBracketInfo>
        ) {
            state.contextBracketInfo = action.payload;
        },
        setDateTriggerInfo(state, action: PayloadAction<DateTriggerInfo>) {
            state.dateTriggerInfo = action.payload;
        },
        setActiveSelection(state, action: PayloadAction<ActiveSelection>) {
            state.activeSelection = action.payload;
        },
        resetEditorState(state) {
            state.contextBracketInfo = initialState.contextBracketInfo;
            state.dateTriggerInfo = initialState.dateTriggerInfo;
            state.activeSelection = initialState.activeSelection;
        },
    },
});

export const {
    setContextBracketInfo,
    setDateTriggerInfo,
    setActiveSelection,
    resetEditorState,
} = editorSlice.actions;

export default editorSlice.reducer;
