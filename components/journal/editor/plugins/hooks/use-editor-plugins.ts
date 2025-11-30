import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
    EditorPlugin,
    EditorPluginContext,
    SuggestionBoxState,
} from "../types";
import {
    selectIsSuggestionBoxOpen,
    selectSelectedSuggestion,
    selectEditorSuggestionState,
} from "@/store/contextSuggestionSlice";

interface UseEditorPluginsProps {
    /** Current content of the textarea */
    content: string;
    /** Reference to the textarea element */
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    /** Whether editor is in edit mode (editing existing note) */
    isEditMode: boolean;
    /** Whether chat mode is active */
    chatMode: boolean;
    /** Whether submission is in progress */
    isSubmitting: boolean;
    /** Composed plugin chain to execute on key down */
    pluginChain: EditorPlugin;
    /** Callback to update content */
    onContentChange: (content: string) => void;
}

/**
 * Hook to integrate plugin system with the notes editor
 *
 * Provides a handleKeyDown function that:
 * 1. Builds the plugin context from current editor state
 * 2. Executes the plugin chain
 * 3. Applies the results (preventDefault, content updates, cursor positioning)
 *
 * The hook maintains referential stability through useCallback, ensuring
 * it only updates when dependencies change.
 *
 * @param props - Configuration for the plugin system
 * @returns Object containing the handleKeyDown function
 *
 * @example
 * ```typescript
 * const { handleKeyDown } = useEditorPlugins({
 *   content,
 *   textareaRef,
 *   isEditMode,
 *   chatMode,
 *   isSubmitting,
 *   pluginChain: defaultEditorPluginChain,
 *   onContentChange: setContent,
 * });
 *
 * <Textarea onKeyDown={handleKeyDown} />
 * ```
 */
export function useEditorPlugins({
    content,
    textareaRef,
    isEditMode,
    chatMode,
    isSubmitting,
    pluginChain,
    onContentChange,
}: UseEditorPluginsProps) {
    const dispatch = useAppDispatch();

    // Get the editor ID (consistent with how it's calculated in the plugin)
    const editorId = isEditMode ? "edit" : "new";

    // Select suggestion box state from Redux
    const editorSuggestionState = useAppSelector((state) =>
        selectEditorSuggestionState(state, editorId)
    );
    const isOpen = useAppSelector((state) =>
        selectIsSuggestionBoxOpen(state, editorId)
    );
    const selectedSuggestion = useAppSelector((state) =>
        selectSelectedSuggestion(state, editorId)
    );

    // Get user preference for Enter key behavior
    const enterToSubmit = useAppSelector(
        (state) => state.userPreferences.preferences.enterToSubmit.value
    );

    // Build suggestion box state for context - memoized to prevent re-renders
    const suggestionBoxState: SuggestionBoxState = useMemo(
        () => ({
            isOpen,
            selectedSuggestion,
            suggestions: editorSuggestionState?.suggestions || [],
        }),
        [isOpen, selectedSuggestion, editorSuggestionState?.suggestions]
    );

    /**
     * Handles keyboard events in the textarea
     *
     * Executes the plugin chain and applies results:
     * - Prevents default behavior if any plugin requests it
     * - Updates content if plugins modify it
     * - Updates cursor position if plugins specify it
     *
     * @param event - React keyboard event from textarea
     */
    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            // Build plugin context with current editor state
            const context: EditorPluginContext = {
                content,
                cursorPosition: textarea.selectionStart,
                selectionStart: textarea.selectionStart,
                selectionEnd: textarea.selectionEnd,
                textareaRef,
                dispatch,
                isEditMode,
                chatMode,
                isSubmitting,
                suggestionBoxState,
                enterToSubmit,
            };

            // Execute plugin chain with initial result
            const result = pluginChain(event, context, { continue: true });

            // Apply preventDefault if any plugin requested it
            if (result.preventDefault) {
                event.preventDefault();
            }

            // Apply content changes if plugins modified it
            if (result.updatedContent !== undefined) {
                onContentChange(result.updatedContent);

                // Update cursor position or selection range if specified
                if (
                    result.updatedSelectionStart !== undefined &&
                    result.updatedSelectionEnd !== undefined
                ) {
                    const selectionStart = result.updatedSelectionStart;
                    const selectionEnd = result.updatedSelectionEnd;

                    // Update selection range (for wrapping operations)
                    setTimeout(() => {
                        if (textareaRef.current) {
                            textareaRef.current.setSelectionRange(
                                selectionStart,
                                selectionEnd
                            );
                        }
                    }, 0);
                } else if (result.updatedCursorPosition !== undefined) {
                    // Update cursor position only (for completion operations)
                    setTimeout(() => {
                        if (textareaRef.current) {
                            if (
                                typeof result.updatedCursorPosition === "number"
                            ) {
                                textareaRef.current.setSelectionRange(
                                    result.updatedCursorPosition,
                                    result.updatedCursorPosition
                                );
                            }
                        }
                    }, 0);
                }
            }
        },
        [
            content,
            textareaRef,
            dispatch,
            isEditMode,
            chatMode,
            isSubmitting,
            pluginChain,
            onContentChange,
            suggestionBoxState,
            enterToSubmit,
        ]
    );

    return { handleKeyDown };
}
