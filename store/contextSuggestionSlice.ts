import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./index";

/**
 * Represents a single context suggestion item
 */
export interface ContextSuggestionItem {
    /** Slug format of the context (e.g., "example-context") */
    context: string;
    /** Sentence case format of the context (e.g., "Example Context") */
    label: string;
    /** Number of times this context has been used */
    count?: number;
}

/**
 * State for a single editor's context suggestion box
 */
interface EditorContextSuggestionState {
    /** Whether the suggestion box is currently open */
    isOpen: boolean;
    /** Current search query typed by the user */
    query: string;
    /** Array of suggested contexts */
    suggestions: ContextSuggestionItem[];
    /** Currently selected suggestion index (-1 if none selected) */
    selectedIndex: number;
    /** Cursor position where the context bracket starts */
    bracketStartPosition: number;
    /** Whether suggestions are currently being loaded */
    isLoading: boolean;
}

/**
 * Root state containing context suggestions for all editor instances
 * Each editor instance is keyed by a unique identifier (e.g., note ID or "new")
 */
interface ContextSuggestionState {
    /** Map of editor instances to their context suggestion states */
    editors: Record<string, EditorContextSuggestionState>;
}

const initialState: ContextSuggestionState = {
    editors: {},
};

/**
 * Creates the initial state for a new editor instance
 */
const createInitialEditorState = (): EditorContextSuggestionState => ({
    isOpen: false,
    query: "",
    suggestions: [],
    selectedIndex: -1,
    bracketStartPosition: -1,
    isLoading: false,
});

const contextSuggestionSlice = createSlice({
    name: "contextSuggestion",
    initialState,
    reducers: {
        /**
         * Opens the context suggestion box for a specific editor
         * @param editorId - Unique identifier for the editor instance
         * @param bracketStartPosition - Position where [[ starts in the text
         */
        openSuggestionBox(
            state,
            action: PayloadAction<{
                editorId: string;
                bracketStartPosition: number;
            }>
        ) {
            const { editorId, bracketStartPosition } = action.payload;
            state.editors[editorId] ??= createInitialEditorState();
            state.editors[editorId].isOpen = true;
            state.editors[editorId].bracketStartPosition = bracketStartPosition;
            state.editors[editorId].selectedIndex = -1;
            state.editors[editorId].query = "";
            state.editors[editorId].suggestions = [];
        },

        /**
         * Closes the context suggestion box for a specific editor
         * @param editorId - Unique identifier for the editor instance
         */
        closeSuggestionBox(state, action: PayloadAction<string>) {
            const editorId = action.payload;
            if (state.editors[editorId]) {
                state.editors[editorId].isOpen = false;
                state.editors[editorId].query = "";
                state.editors[editorId].suggestions = [];
                state.editors[editorId].selectedIndex = -1;
            }
        },

        /**
         * Updates the search query for a specific editor
         * @param editorId - Unique identifier for the editor instance
         * @param query - The search query typed by the user
         */
        setQuery(
            state,
            action: PayloadAction<{ editorId: string; query: string }>
        ) {
            const { editorId, query } = action.payload;
            if (state.editors[editorId]) {
                state.editors[editorId].query = query;
                state.editors[editorId].selectedIndex = -1;
            }
        },

        /**
         * Sets the suggestions for a specific editor
         * @param editorId - Unique identifier for the editor instance
         * @param suggestions - Array of context suggestions
         */
        setSuggestions(
            state,
            action: PayloadAction<{
                editorId: string;
                suggestions: ContextSuggestionItem[];
            }>
        ) {
            const { editorId, suggestions } = action.payload;
            if (state.editors[editorId]) {
                state.editors[editorId].suggestions = suggestions;
                state.editors[editorId].selectedIndex = -1;
            }
        },

        /**
         * Sets the loading state for a specific editor
         * @param editorId - Unique identifier for the editor instance
         * @param isLoading - Whether suggestions are being loaded
         */
        setLoading(
            state,
            action: PayloadAction<{ editorId: string; isLoading: boolean }>
        ) {
            const { editorId, isLoading } = action.payload;
            if (state.editors[editorId]) {
                state.editors[editorId].isLoading = isLoading;
            }
        },

        /**
         * Moves the selection down in the suggestion list
         * @param editorId - Unique identifier for the editor instance
         */
        selectNext(state, action: PayloadAction<string>) {
            const editorId = action.payload;
            if (state.editors[editorId]) {
                const editor = state.editors[editorId];
                if (editor.suggestions.length > 0) {
                    editor.selectedIndex =
                        editor.selectedIndex < editor.suggestions.length - 1
                            ? editor.selectedIndex + 1
                            : 0;
                }
            }
        },

        /**
         * Moves the selection up in the suggestion list
         * @param editorId - Unique identifier for the editor instance
         */
        selectPrevious(state, action: PayloadAction<string>) {
            const editorId = action.payload;
            if (state.editors[editorId]) {
                const editor = state.editors[editorId];
                if (editor.suggestions.length > 0) {
                    editor.selectedIndex =
                        editor.selectedIndex > 0
                            ? editor.selectedIndex - 1
                            : editor.suggestions.length - 1;
                }
            }
        },

        /**
         * Sets a specific index as selected
         * @param editorId - Unique identifier for the editor instance
         * @param index - The index to select
         */
        setSelectedIndex(
            state,
            action: PayloadAction<{ editorId: string; index: number }>
        ) {
            const { editorId, index } = action.payload;
            if (state.editors[editorId]) {
                state.editors[editorId].selectedIndex = index;
            }
        },

        /**
         * Clears the context suggestion state for a specific editor
         * @param editorId - Unique identifier for the editor instance
         */
        clearEditorState(state, action: PayloadAction<string>) {
            const editorId = action.payload;
            delete state.editors[editorId];
        },
    },
});

export const {
    openSuggestionBox,
    closeSuggestionBox,
    setQuery,
    setSuggestions,
    setLoading,
    selectNext,
    selectPrevious,
    setSelectedIndex,
    clearEditorState,
} = contextSuggestionSlice.actions;

// Selectors
/**
 * Gets the context suggestion state for a specific editor
 */
export const selectEditorSuggestionState = (
    state: RootState,
    editorId: string
): EditorContextSuggestionState | undefined => {
    return state.contextSuggestion.editors[editorId];
};

/**
 * Checks if the suggestion box is open for a specific editor
 */
export const selectIsSuggestionBoxOpen = (
    state: RootState,
    editorId: string
): boolean => {
    return state.contextSuggestion.editors[editorId]?.isOpen ?? false;
};

/**
 * Gets the selected suggestion for a specific editor
 */
export const selectSelectedSuggestion = (
    state: RootState,
    editorId: string
): ContextSuggestionItem | null => {
    const editor = state.contextSuggestion.editors[editorId];
    if (!editor || editor.selectedIndex < 0) {
        return null;
    }
    return editor.suggestions[editor.selectedIndex] ?? null;
};

export default contextSuggestionSlice.reducer;
