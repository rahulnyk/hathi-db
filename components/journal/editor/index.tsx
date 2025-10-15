"use client";

import { useState, useRef, useEffect } from "react";
import { Note } from "@/store/notesSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Check, X, LucideMessageCircleQuestion } from "lucide-react";
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
import { useChat } from "@ai-sdk/react";
import { useSharedChatContext } from "@/lib/chat-context";

interface NotesEditorProps {
    note?: Note;
}

/**
 * NotesEditor Component
 *
 * A simplified notes editor that provides basic text editing functionality with:
 * - Content persistence through draft storage
 * - Note creation and editing
 * - Chat mode for AI interactions
 * - Auto-save of unsaved drafts
 *
 * @param note - Optional note to edit. If provided, enters edit mode.
 */
export function NotesEditor({ note }: NotesEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dispatch = useAppDispatch();

    // Redux state
    const chatMode = useAppSelector((state) => state.ui.chatMode);
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

    // Chat functionality
    const { chat } = useSharedChatContext();
    const chatHook = useChat({ chat });

    // Derived state
    const isEditMode = !!note;

    /**
     * Handles content changes in the textarea
     * Updates local state and persists draft for new notes
     */
    const handleContentChange = (
        event: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        const newContent = event.target.value;
        setContent(newContent);

        // Auto-save draft for new notes (not in edit mode)
        if (!isEditMode) {
            dispatch(updateDraftContent(newContent));
        }
    };

    /**
     * Handles Enter key press for form submission
     * Shift+Enter allows multi-line input
     */
    const handleKeyDown = async (
        event: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (content.trim() && !isSubmitting) {
                await handleSubmit(event);
            }
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
     * Saves edits to existing note
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
     * Cancels note editing and restores original content
     */
    const cancelEdit = (): void => {
        if (!note || !originalNoteState) return;

        setContent(originalNoteState.content);
        dispatch(setEditingNoteId(null));
    };

    /**
     * Handles form submission
     * Routes to chat or note creation/editing based on mode
     */
    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        // Chat mode: send message to AI
        if (chatMode && chatHook && !isEditMode) {
            chatHook.sendMessage({ text: content.trim() });
            setContent("");
            dispatch(clearDraft());
            return;
        }

        // Note mode: create or update note
        if (isEditMode) {
            saveEdit();
        } else {
            await createNote();
        }
    };

    /**
     * Handles context changes from ContextContainer
     */
    const handleContextsChange = (newContexts: string[]) => {
        setContexts(newContexts);
    };

    // Sync content when editing a note
    useEffect(() => {
        if (note?.id) {
            setContent(note.content);
            setContexts(note.contexts || []);
        }
    }, [note]);

    // Load draft content for new notes
    useEffect(() => {
        if (!isEditMode) {
            setContent(draftContent);
        }
    }, [draftContent, isEditMode]);

    // Focus textarea when entering edit mode
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
                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleContentChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        isEditMode
                            ? "Edit your note..."
                            : chatMode
                            ? "Ask me to find your notes..."
                            : "Use Markdown to format your notes..."
                    }
                />

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
                                    onClick={saveEdit}
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
                                    <>
                                        {chatMode ? (
                                            <LucideMessageCircleQuestion
                                                strokeWidth={3}
                                                size={16}
                                            />
                                        ) : (
                                            <ArrowUp
                                                strokeWidth={3}
                                                size={16}
                                            />
                                        )}
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
