/**
 * Editor Context Hook - Centralized editor state management for plugins and commands
 *
 * This module provides a unified interface for accessing and managing editor state
 * across the entire editor ecosystem, including plugins, commands, and the main editor.
 */

import { useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateDraftContent, clearDraft } from "@/store/draftSlice";
import { setChatMode, setEditingNoteId } from "@/store/uiSlice";
import {
    updateNoteOptimistically,
    createNoteOptimistically,
    Note,
} from "@/store/notesSlice";
import {
    selectContextBracketInfo,
    selectDateTriggerInfo,
    selectActiveSelection,
    selectChatMode,
    createEditorActions,
    type ContextBracketInfo,
    type DateTriggerInfo,
    type ActiveSelection,
} from "@/lib/editor-utils";
import { createOptimisticNote, extractMetadata } from "@/lib/noteUtils";
import { determineNoteType } from "@/lib/note-type-utils";
import { useChat } from "@ai-sdk/react";
import { useSharedChatContext } from "@/lib/chat-context";

/**
 * Core editor state interface - read-only state properties
 */
export interface EditorState {
    /** Current text content */
    content: string;
    /** Current cursor/selection position */
    activeSelection: ActiveSelection;
    /** Context bracket detection state */
    contextBracketInfo: ContextBracketInfo;
    /** Date trigger detection state */
    dateTriggerInfo: DateTriggerInfo;
    /** Whether editor is in chat mode */
    chatMode: boolean;
    /** Whether editor is in edit mode */
    isEditMode: boolean;
    /** Whether a submission is in progress */
    isSubmitting: boolean;
    /** Current note being edited (if any) */
    note?: Note;
    /** Current contexts for the note */
    contexts: string[];
    /** Current key context from Redux */
    currentKeyContext: string | null;
    /** Draft content for new notes */
    draftContent: string;
}

/**
 * Computed UI state interface - derived state for UI components
 */
export interface EditorUIState {
    /** Whether context suggestions should be shown */
    shouldShowContextSuggestions: boolean;
    /** Whether date picker should be shown */
    shouldShowDatePicker: boolean;
}

/**
 * Editor actions interface - functions to modify editor state
 */
export interface EditorActions {
    /** Update the content */
    setContent: (content: string) => void;
    /** Update the active selection */
    setActiveSelection: (selection: ActiveSelection) => void;
    /** Update contexts */
    setContexts: (contexts: string[]) => void;
    /** Set submitting state */
    setIsSubmitting: (isSubmitting: boolean) => void;

    // Redux actions
    /** Update draft content */
    updateDraftContent: (content: string) => void;
    /** Clear draft content */
    clearDraft: () => void;
    /** Toggle chat mode */
    setChatMode: (enabled: boolean) => void;
    /** Set editing note ID */
    setEditingNoteId: (noteId: string | null) => void;

    // Editor state actions (from editor-utils)
    /** Set context bracket info */
    setContextBracketInfo: (info: ContextBracketInfo) => void;
    /** Set date trigger info */
    setDateTriggerInfo: (info: DateTriggerInfo) => void;
    /** Close context suggestions */
    closeContextSuggestions: () => void;
    /** Close date picker */
    closeDatePicker: () => void;
    /** Reset editor state */
    resetEditorState: () => void;
}

/**
 * Editor operations interface - high-level editor operations
 */
export interface EditorOperations {
    /** Save current note edits */
    saveEdit: () => void;
    /** Cancel current note edits */
    cancelEdit: () => void;
    /** Submit form (handles both chat and notes) */
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    /** Create a new note from current content */
    createNote: () => Promise<void>;
}

/**
 * Editor context interface - complete editor context for plugins and commands
 */
export interface EditorContext {
    /** Read-only editor state */
    state: EditorState;
    /** Computed UI state */
    uiState: EditorUIState;
    /** Editor actions */
    actions: EditorActions;
    /** High-level operations */
    operations: EditorOperations;
    /** Reference to textarea element */
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    /** Chat hook for AI interactions */
    chatHook?: ReturnType<typeof useChat>;
    /** Redux dispatch function */
    dispatch: ReturnType<typeof useAppDispatch>;
}

/**
 * Hook parameters interface
 */
export interface CreateEditorContextParams {
    /** Note being edited (optional) */
    note?: Note;
    /** Content setter function */
    setContent: (content: string) => void;
    /** Current content */
    content: string;
    /** Contexts setter function */
    setContexts: (contexts: string[]) => void;
    /** Current contexts */
    contexts: string[];
    /** Is submitting setter function */
    setIsSubmitting: (isSubmitting: boolean) => void;
    /** Current is submitting state */
    isSubmitting: boolean;
    /** Reference to textarea element */
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

/**
 * Factory function that creates editor context for plugins and commands
 *
 * This factory function centralizes all editor state management and provides a clean interface
 * for plugins, commands, and the main editor to interact with editor state.
 *
 * Creates a shared editor context instance (not per-component state), hence the factory function naming convention rather than hook naming.
 * @param params Configuration parameters for the editor context
 * @returns Complete editor context
 */
export function createEditorContext(
    params: CreateEditorContextParams
): EditorContext {
    const {
        note,
        setContent,
        content,
        setContexts,
        contexts,
        setIsSubmitting,
        isSubmitting,
        textareaRef,
    } = params;

    const dispatch = useAppDispatch();

    // Redux selectors
    const contextBracketInfo = useAppSelector(selectContextBracketInfo);
    const dateTriggerInfo = useAppSelector(selectDateTriggerInfo);
    const activeSelection = useAppSelector(selectActiveSelection);
    const chatMode = useAppSelector(selectChatMode);
    const currentKeyContext = useAppSelector(
        (state) => state.notes.currentContext
    );
    const draftContent = useAppSelector((state) => state.draft.content);
    const originalNoteState = useAppSelector((state) =>
        note?.id ? state.ui.originalNoteStates[note.id] : null
    );

    // Editor actions from editor-utils
    const editorActions = createEditorActions(dispatch);

    // Chat context
    const { chat } = useSharedChatContext();
    const chatHook = useChat({ chat });

    // Derived state
    const isEditMode = !!note;

    /**
     * Creates a new note from current content
     */
    const createNote = async (): Promise<void> => {
        setIsSubmitting(true);

        const { contexts: extractedContexts, tags } = extractMetadata(content);
        const mergedContexts = [
            ...new Set([...contexts, ...extractedContexts]),
        ];
        const noteType = determineNoteType(content);

        const optimisticNote = createOptimisticNote(
            content,
            currentKeyContext,
            noteType,
            mergedContexts,
            tags
        );

        dispatch(
            createNoteOptimistically({
                note: optimisticNote,
                autoSave: true,
            })
        );

        setContent("");
        setContexts([]);
        dispatch(clearDraft());
        setIsSubmitting(false);
    };

    /**
     * Saves current note edits
     */
    const saveEdit = (): void => {
        if (!note) return;

        dispatch(
            updateNoteOptimistically({
                noteId: note.id,
                patches: { content },
            })
        );

        dispatch(setEditingNoteId(null));
    };

    /**
     * Cancels current note edits
     */
    const cancelEdit = (): void => {
        if (!note || !originalNoteState) return;

        setContent(originalNoteState.content);
        dispatch(setEditingNoteId(null));
    };

    /**
     * Handles form submission (chat or notes)
     */
    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        // If in chat mode and chatHook is provided, use chat instead of creating notes
        if (chatMode && chatHook && !isEditMode) {
            chatHook.sendMessage({ text: content.trim() });
            setContent("");
            dispatch(clearDraft());
            return;
        }

        if (isEditMode) {
            saveEdit();
        } else {
            await createNote();
        }
    };

    // Build the complete editor state
    const state: EditorState = {
        content,
        activeSelection,
        contextBracketInfo,
        dateTriggerInfo,
        chatMode,
        isEditMode,
        isSubmitting,
        note,
        contexts,
        currentKeyContext,
        draftContent,
    };

    // Compute UI state
    const uiState: EditorUIState = {
        shouldShowContextSuggestions:
            !chatMode &&
            contextBracketInfo.isInsideBrackets &&
            contextBracketInfo.searchTerm.length >= 2 &&
            !dateTriggerInfo.isTriggerFound,
        shouldShowDatePicker: !chatMode && dateTriggerInfo.isTriggerFound,
    };

    // Build editor actions
    const actions: EditorActions = {
        setContent,
        setActiveSelection: editorActions.setActiveSelection,
        setContexts,
        setIsSubmitting,
        updateDraftContent: (content) => dispatch(updateDraftContent(content)),
        clearDraft: () => dispatch(clearDraft()),
        setChatMode: (enabled) => dispatch(setChatMode(enabled)),
        setEditingNoteId: (noteId) => dispatch(setEditingNoteId(noteId)),
        setContextBracketInfo: editorActions.setContextBracketInfo,
        setDateTriggerInfo: editorActions.setDateTriggerInfo,
        closeContextSuggestions: editorActions.closeContextSuggestions,
        closeDatePicker: editorActions.closeDatePicker,
        resetEditorState: editorActions.resetEditorState,
    };

    // Build editor operations
    const operations: EditorOperations = {
        saveEdit,
        cancelEdit,
        handleSubmit,
        createNote,
    };

    return {
        state,
        uiState,
        actions,
        operations,
        textareaRef,
        chatHook,
        dispatch,
    };
}
