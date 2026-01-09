"use client";

import { useState, useRef, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Note } from "@/store/notesSlice";
import { cn } from "@/lib/utils";
import { insertContextInBrackets } from "@/lib/bracketMatchUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Check, X } from "lucide-react";
import { HashLoader } from "react-spinners";
import { ContextContainer } from "../note_card/context-container";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateDraftContent, clearDraft } from "@/store/draftSlice";
import { setEditingNoteId } from "@/store/uiSlice";
import {
    updateNoteOptimistically,
    createNoteOptimistically,
} from "@/store/notesSlice";
import { createOptimisticNote, extractMetadata } from "@/lib/noteUtils";
import { determineNoteType } from "@/lib/note-type-utils";
import { useEditorPlugins, defaultEditorPluginChain } from "./plugins";
import { ContextSuggestionBox } from "@/components/ui/context-suggestion-box";
import {
    selectIsSuggestionBoxOpen,
    closeSuggestionBox,
} from "@/store/contextSuggestionSlice";

interface NotesEditorProps {
    note?: Note;
}

/**
 * NotesEditor Component
 *
 * Unified notes editor with automatic content persistence:
 * - New notes: Auto-save to draft storage on every keystroke
 * - Editing notes: Auto-save to Redux with 300ms debounce
 * - All changes automatically persisted via middleware
 * - No manual save required - changes are never lost
 *
 * @param note - Optional note to edit. If provided, enters edit mode.
 */
export function NotesEditor({ note }: NotesEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dispatch = useAppDispatch();

    // Redux state
    const currentKeyContext = useAppSelector(
        (state) => state.notes.currentContext
    );
    const draftContent = useAppSelector((state) => state.draft.content);
    const originalNoteState = useAppSelector((state) =>
        note?.id ? state.ui.originalNoteStates[note.id] : null
    );

    // Local state
    const [contexts, setContexts] = useState(note?.contexts || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [content, setContent] = useState(note ? note.content : "");

    // Derived state
    const isEditMode = !!note;
    const editorId = isEditMode ? "edit" : "new";

    // Check if suggestion box is open for this editor
    const isSuggestionBoxOpen = useAppSelector((state) =>
        selectIsSuggestionBoxOpen(state, editorId)
    );

    // Plugin system integration
    const { handleKeyDown } = useEditorPlugins({
        content,
        textareaRef,
        isEditMode,
        isSubmitting,
        pluginChain: defaultEditorPluginChain,
        onContentChange: setContent,
    });

    /**
     * Debounced auto-save for editing notes
     * Delays Redux dispatch by 300ms to avoid excessive updates while typing
     */
    const debouncedUpdateNote = useDebouncedCallback(
        (noteId: string, newContent: string) => {
            dispatch(
                updateNoteOptimistically({
                    noteId,
                    patches: { content: newContent },
                })
            );
        },
        300
    );

    /**
     * Handles content changes in the textarea
     * Auto-saves content immediately for new notes, with 300ms debounce for edits
     */
    const handleContentChange = (
        event: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        const newContent = event.target.value;
        setContent(newContent);

        if (!isEditMode) {
            // New note: Update draft immediately
            dispatch(updateDraftContent(newContent));
        } else if (note) {
            // Edit mode: Debounced Redux update (300ms)
            debouncedUpdateNote(note.id, newContent);
        }
    };

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
     * Exits edit mode
     * Content is already auto-saved via handleContentChange
     */
    const exitEditMode = (): void => {
        if (!note) return;

        // Flush any pending debounced updates to ensure all changes are saved
        debouncedUpdateNote.flush();

        dispatch(setEditingNoteId(null));
    };

    /**
     * Cancels note editing and restores original content
     * Reverts both Redux state and local state to snapshot taken when entering edit mode
     */
    const cancelEdit = (): void => {
        if (!note || !originalNoteState) return;

        // Cancel any pending debounced updates to prevent overwriting restored content
        debouncedUpdateNote.cancel();

        // Revert Redux state to original content
        dispatch(
            updateNoteOptimistically({
                noteId: note.id,
                patches: { content: originalNoteState.content },
            })
        );

        // Revert local state
        setContent(originalNoteState.content);

        // Exit edit mode
        dispatch(setEditingNoteId(null));
    };

    /**
     * Handles form submission
     * Creates new note or exits edit mode (content already auto-saved)
     */
    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        if (isEditMode) {
            exitEditMode(); // Just exits edit mode
        } else {
            await createNote(); // Creates and persists new note
        }
    };

    /**
     * Handles context changes from ContextContainer
     */
    const handleContextsChange = (newContexts: string[]) => {
        setContexts(newContexts);
    };

    /**
     * Handles context selection from the suggestion box
     * Inserts the selected context between [[ ]] at the cursor position
     */
    const handleContextSelect = (selectedContext: string) => {
        if (!textareaRef.current) return;

        const cursorPos = textareaRef.current.selectionStart;

        // Use the utility function to insert the context
        const result = insertContextInBrackets(
            content,
            cursorPos,
            selectedContext
        );

        if (!result) {
            // Not in context brackets, close the suggestion box
            dispatch(closeSuggestionBox(editorId));
            return;
        }

        // Update the content
        setContent(result.newContent);

        // Auto-save the updated content
        if (!isEditMode) {
            dispatch(updateDraftContent(result.newContent));
        } else if (note) {
            debouncedUpdateNote(note.id, result.newContent);
        }

        // Close suggestion box
        dispatch(closeSuggestionBox(editorId));

        // Move cursor after the inserted context
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(
                    result.newCursorPosition,
                    result.newCursorPosition
                );
            }
        }, 0);
    };

    /**
     * Sync content when entering edit mode for a different note
     * Only triggers when note ID changes, not on every Redux update
     * This prevents the snap-back bug where typing gets overwritten
     */
    useEffect(() => {
        if (note?.id) {
            setContent(note.content);
            setContexts(note.contexts || []);
        }
    }, [note?.id]);

    /**
     * Cleanup debounced updates when component unmounts or note changes
     * Prevents stale updates from dispatching after unmount or with wrong noteId
     */
    useEffect(() => {
        return () => {
            debouncedUpdateNote.cancel();
        };
    }, [note?.id, debouncedUpdateNote]);

    /**
     * Load draft content for new notes from Redux persist
     * Restores unsaved work after page refresh
     */
    useEffect(() => {
        if (!isEditMode) {
            setContent(draftContent);
        }
    }, [draftContent, isEditMode]);

    /**
     * Auto-focus textarea when entering edit mode
     * Cursor positioned at end of content
     */
    useEffect(() => {
        if (isEditMode && textareaRef.current) {
            textareaRef.current.focus();
            const length = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(length, length);
        }
    }, [isEditMode]);

    return (
        <div className="p-0 relative">
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    {/* Context Suggestion Box */}
                    {isSuggestionBoxOpen && (
                        <ContextSuggestionBox
                            editorId={editorId}
                            onContextSelect={handleContextSelect}
                        />
                    )}

                    <Textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Use Markdown to format your notes..."
                    />
                </div>

                <div className="flex justify-between items-end m-0 mb-1 gap-2">
                    {isEditMode && note && (
                        <>
                            <ContextContainer
                                contexts={note.contexts || []}
                                suggestedContexts={
                                    note.suggested_contexts || []
                                }
                                onContextsChange={handleContextsChange}
                                readOnly={false}
                                className="flex-1"
                                note={note}
                                enableIndependentUpdates={true}
                            />
                            <div className="flex justify-end items-end pb-2 gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={cancelEdit}
                                    className="flex items-center gap-2 rounded-xl"
                                    size="icon"
                                >
                                    <X strokeWidth={3} size={14} />
                                </Button>
                                <Button
                                    type="button"
                                    onClick={exitEditMode}
                                    disabled={isSubmitting || !content.trim()}
                                    className="flex items-center gap-2 rounded-xl"
                                    size="icon"
                                >
                                    {isSubmitting ? (
                                        <HashLoader size={14} />
                                    ) : (
                                        <Check strokeWidth={3} size={14} />
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                    {!isEditMode && (
                        <div className="flex justify-end w-full">
                            <Button
                                type="submit"
                                disabled={isSubmitting || !content.trim()}
                                className={cn(
                                    "flex items-center gap-2 rounded-xl"
                                )}
                                size="icon"
                            >
                                {isSubmitting ? (
                                    <HashLoader size={16} />
                                ) : (
                                    <ArrowUp strokeWidth={3} size={16} />
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
