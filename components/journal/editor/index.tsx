"use client";

import { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
    updateNoteOptimistically,
    createNoteOptimistically,
    Note,
} from "@/store/notesSlice";
import { setEditingNoteId } from "@/store/uiSlice";
import { updateDraftContent, clearDraft } from "@/store/draftSlice";
import { createOptimisticNote, extractMetadata } from "@/lib/noteUtils";
import { determineNoteType } from "@/lib/note-type-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Check, X, LucideMessageCircleQuestion } from "lucide-react";
import { HashLoader } from "react-spinners";
import { ContextContainer } from "../note_card/context-container";
import { useChat } from "@ai-sdk/react";
import { useSharedChatContext } from "@/lib/chat-context";
import { processEditorCommands, CommandManagerContext } from "./editorCommands";
import { processKeyboardEvent, PluginContext } from "./editorPlugins";

interface NotesEditorProps {
    note?: Note;
}

// Q&A command constants
const QA_COMMAND = "/q or qq";
const NOTES_COMMAND = "/n or nn";

export function NotesEditor({ note }: NotesEditorProps) {
    const isEditMode = !!note;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isUserInteracting = useRef(false);
    const [contexts, setContexts] = useState(note?.contexts || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeSelection, setActiveSelection] = useState({
        start: 0,
        end: 0,
    });

    const { chat } = useSharedChatContext();
    const chatHook = useChat({ chat });

    const dispatch = useAppDispatch();
    const currentKeyContext = useAppSelector(
        (state) => state.notes.currentContext
    );
    const chatMode = useAppSelector((state) => state.ui.chatMode);
    const originalNoteState = useAppSelector((state) =>
        note?.id ? state.ui.originalNoteStates[note.id] : null
    );
    const draftContent = useAppSelector((state) => state.draft.content);

    // Use draft content for new notes, note content for edit mode
    const [content, setContent] = useState(
        isEditMode ? note?.content ?? "" : draftContent
    );

    // Update content when draft changes (only for new notes)
    useEffect(() => {
        if (!isEditMode) {
            setContent(draftContent);
        }
    }, [draftContent, isEditMode]);

    useEffect(() => {
        if (note?.id) {
            setContent(note.content);
            setContexts(note.contexts || []);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [note?.id]); // Important!! // Only run when note ID changes, not content or contexts

    const saveNote = (
        patches: Partial<Pick<Note, "content" | "contexts" | "tags">>
    ) => {
        if (note && isEditMode) {
            dispatch(
                updateNoteOptimistically({
                    noteId: note.id,
                    patches,
                })
            );
        }
    };

    // Focus textarea and set cursor to end when entering edit mode
    useEffect(() => {
        if (isEditMode && textareaRef.current && !isUserInteracting.current) {
            textareaRef.current.focus();
            // Set cursor to end of content when entering edit mode
            const length = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(length, length);
        }
    }, [isEditMode]); // Only run when entering/exiting edit mode

    const handleSelect = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
        setActiveSelection({
            start: event.currentTarget.selectionStart,
            end: event.currentTarget.selectionEnd,
        });
    };

    const handleContentChange = (
        event: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        isUserInteracting.current = true;
        const newFullValue = event.target.value;
        const newSelectionStart = event.target.selectionStart;
        const newSelectionEnd = event.target.selectionEnd;

        setContent(newFullValue);

        // Save draft for new notes (not in edit mode)
        if (!isEditMode) {
            dispatch(updateDraftContent(newFullValue));
        }

        // Handle mode switching commands using command manager
        if (!isEditMode) {
            const commandContext: CommandManagerContext = {
                dispatch,
                setContent,
            };

            if (processEditorCommands(newFullValue, commandContext)) {
                return; // Exit early if command was processed
            }
        }

        // Always update active selection to track cursor position
        setActiveSelection({
            start: newSelectionStart,
            end: newSelectionEnd,
        });

        // Reset the flag after a short delay
        setTimeout(() => {
            isUserInteracting.current = false;
        }, 10);
    };

    // Refactored handleKeyDown function using plugin system
    const handleKeyDown = async (
        event: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
        const pluginContext: PluginContext = {
            content,
            setContent,
            activeSelection,
            setActiveSelection,
            textareaRef,
            dispatch,
            isEditMode,
            isSubmitting,
            chatMode,
            chatHook,
            handleSaveEdit,
            handleCreateNote,
        };

        await processKeyboardEvent(event, pluginContext);
    };

    const handleContextsChange = (newContexts: string[]) => {
        setContexts(newContexts);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        // If in chat mode and chatHook is provided, use chat instead of creating notes
        if (chatMode && chatHook && !isEditMode) {
            // Use chatHook's handleSubmit method
            chatHook.sendMessage({ text: content.trim() });
            setContent("");
            dispatch(clearDraft()); // Clear draft after chat submission
            return;
        }

        if (isEditMode) {
            handleSaveEdit();
        } else {
            await handleCreateNote();
        }
    };

    const handleCreateNote = async () => {
        setIsSubmitting(true);

        const { contexts: extractedContexts, tags } = extractMetadata(content);
        const mergedContexts = [
            ...new Set([...contexts, ...extractedContexts]),
        ];

        // Use the utility function to determine note type
        const noteType = determineNoteType(content);

        const optimisticNote = createOptimisticNote(
            content,
            currentKeyContext,
            noteType, // Pass determined note type
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
        dispatch(clearDraft()); // Clear draft after successful note creation
        setIsSubmitting(false);
    };

    const handleSaveEdit = () => {
        if (!note) return;

        // Only save content changes - contexts are handled independently
        saveNote({
            content,
        });

        // Exit edit mode
        dispatch(setEditingNoteId(null));
    };

    const handleCancelEdit = () => {
        if (!note || !originalNoteState) return;

        // Only restore content - context changes should persist
        setContent(originalNoteState.content);

        // Exit edit mode without saving content changes
        dispatch(setEditingNoteId(null));
    };

    return (
        <div className="p-0">
            <form onSubmit={handleSubmit}>
                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleContentChange}
                    onKeyDown={handleKeyDown}
                    onSelect={handleSelect}
                    placeholder={
                        isEditMode
                            ? "Edit your note..."
                            : chatMode
                            ? `Ask me to find your notes... Start with ${NOTES_COMMAND} to return to your notes!`
                            : `Use Markdown to format your notes. Start with ${QA_COMMAND} to ask questions about your notes!`
                    }
                />
                <div className="flex justify-between items-end m-0 mb-1 gap-2">
                    {isEditMode && (
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
                                    onClick={handleCancelEdit}
                                    className="flex items-center gap-2 rounded-xl"
                                    size="icon"
                                >
                                    <X strokeWidth={3} size={14} />
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSaveEdit}
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
