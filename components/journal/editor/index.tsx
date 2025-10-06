"use client";

import { useState, useRef, useEffect } from "react";
import { Note } from "@/store/notesSlice";
import { cn, slugToSentenceCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Check, X, LucideMessageCircleQuestion } from "lucide-react";
import { HashLoader } from "react-spinners";
import { ContextContainer } from "../note_card/context-container";
import { useEditorContext } from "@/hooks/editor-context";
import {
    processEditorCommands,
    QA_COMMAND,
    NOTES_COMMAND,
} from "./editor-commands";
import { processKeyboardEvent } from "./editor-plugins";
import { ContextSuggestionBox } from "./context-suggestion-box";
import { DatePickerBox } from "./date-picker-box";
import {
    detectContextBrackets,
    replaceContextInBrackets,
    detectDateTrigger,
    replaceDateTrigger,
} from "./helpers";

interface NotesEditorProps {
    note?: Note;
}

export function NotesEditor({ note }: NotesEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isUserInteracting = useRef(false);

    // Local state management
    const [contexts, setContexts] = useState(note?.contexts || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [content, setContent] = useState(note ? note.content : "");

    // Initialize editor context without the circular dependency
    const editorContext = useEditorContext({
        note,
        setContent,
        content,
        setContexts,
        contexts,
        setIsSubmitting,
        isSubmitting,
        textareaRef,
    });

    // Custom keyboard and content handlers that integrate with editor context
    const handleContentChange = (
        event: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        isUserInteracting.current = true;
        const newFullValue = event.target.value;
        const newSelectionStart = event.target.selectionStart;

        setContent(newFullValue);

        // Handle mode switching commands using command manager
        if (!note) {
            // Only for new notes
            if (processEditorCommands(newFullValue, editorContext)) {
                return; // Exit early if command was processed
            }
        }

        // Check for context brackets on content change
        checkContextBrackets(newFullValue, newSelectionStart);

        // Check for date trigger on content change (only if not in chat mode)
        if (!editorContext.state.chatMode) {
            const dateInfo = detectDateTrigger(newFullValue, newSelectionStart);
            editorContext.actions.setDateTriggerInfo(dateInfo);
        }

        // Reset the flag after a short delay
        setTimeout(() => {
            isUserInteracting.current = false;
        }, 10);
    };

    const handleKeyDown = async (
        event: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
        await processKeyboardEvent(event, editorContext);
    };

    const handleSelect = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const newSelection = {
            start: event.currentTarget.selectionStart,
            end: event.currentTarget.selectionEnd,
        };

        // Update the active selection in editor context
        editorContext.actions.setActiveSelection(newSelection);

        // Check for context brackets when selection changes
        checkContextBrackets(event.currentTarget.value, newSelection.start);
    };

    // Update content when draft changes (only for new notes)
    useEffect(() => {
        if (!editorContext.state.isEditMode) {
            setContent(editorContext.state.draftContent);
        }
    }, [editorContext.state.draftContent, editorContext.state.isEditMode]);

    useEffect(() => {
        if (note?.id) {
            setContent(note.content);
            setContexts(note.contexts || []);
        }
    }, [note]);

    // Focus textarea and set cursor to end when entering edit mode
    useEffect(() => {
        if (
            editorContext.state.isEditMode &&
            textareaRef.current &&
            !isUserInteracting.current
        ) {
            textareaRef.current.focus();
            const length = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(length, length);
        }
    }, [editorContext.state.isEditMode]);

    // Function to check and update context bracket detection
    const checkContextBrackets = (content: string, cursorPosition: number) => {
        if (editorContext.state.chatMode) {
            return;
        }

        const bracketInfo = detectContextBrackets(content, cursorPosition);
        editorContext.actions.setContextBracketInfo(bracketInfo);
    };

    // Handle context selection from suggestion box
    const handleContextSelect = (selectedContext: string) => {
        if (!editorContext.state.contextBracketInfo.isInsideBrackets) return;

        const sentenceCaseContext = slugToSentenceCase(selectedContext);
        const result = replaceContextInBrackets(
            content,
            editorContext.state.contextBracketInfo,
            sentenceCaseContext
        );

        setContent(result.newContent);

        if (!editorContext.state.isEditMode) {
            editorContext.actions.updateDraftContent(result.newContent);
        }

        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textareaRef.current.setSelectionRange(
                    result.newCursorPosition,
                    result.newCursorPosition
                );
                editorContext.actions.setActiveSelection({
                    start: result.newCursorPosition,
                    end: result.newCursorPosition,
                });
            }
        });

        editorContext.actions.closeContextSuggestions();
    };

    const handleCloseSuggestionBox = () => {
        editorContext.actions.closeContextSuggestions();
    };

    // Handle date selection from date picker
    const handleDateSelect = (selectedDate: Date) => {
        if (!editorContext.state.dateTriggerInfo.isTriggerFound) return;

        const result = replaceDateTrigger(
            content,
            editorContext.state.dateTriggerInfo.triggerPosition,
            selectedDate
        );

        setContent(result.newContent);

        if (!editorContext.state.isEditMode) {
            editorContext.actions.updateDraftContent(result.newContent);
        }

        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textareaRef.current.setSelectionRange(
                    result.newCursorPosition,
                    result.newCursorPosition
                );
                editorContext.actions.setActiveSelection({
                    start: result.newCursorPosition,
                    end: result.newCursorPosition,
                });
            }
        });

        editorContext.actions.closeDatePicker();
    };

    // Handle closing the date picker
    const handleCloseDatePicker = () => {
        if (editorContext.state.dateTriggerInfo.isTriggerFound) {
            const textBefore = content.substring(
                0,
                editorContext.state.dateTriggerInfo.triggerPosition
            );
            const textAfter = content.substring(
                editorContext.state.dateTriggerInfo.triggerPosition + 1
            );
            const newContent = textBefore + textAfter;

            setContent(newContent);

            if (!editorContext.state.isEditMode) {
                editorContext.actions.updateDraftContent(newContent);
            }

            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.setSelectionRange(
                        editorContext.state.dateTriggerInfo.triggerPosition,
                        editorContext.state.dateTriggerInfo.triggerPosition
                    );
                    editorContext.actions.setActiveSelection({
                        start: editorContext.state.dateTriggerInfo
                            .triggerPosition,
                        end: editorContext.state.dateTriggerInfo
                            .triggerPosition,
                    });
                }
            });
        }

        editorContext.actions.closeDatePicker();
    };

    const handleContextsChange = (newContexts: string[]) => {
        setContexts(newContexts);
    };

    return (
        <div className="p-0 relative">
            {/* Date Picker Box - positioned above textarea */}
            <DatePickerBox
                isVisible={editorContext.uiState.shouldShowDatePicker}
                onDateSelect={handleDateSelect}
                onClose={handleCloseDatePicker}
                className="mb-2"
            />

            {/* Context Suggestion Box - positioned above textarea */}
            <ContextSuggestionBox
                searchTerm={editorContext.state.contextBracketInfo.searchTerm}
                isVisible={editorContext.uiState.shouldShowContextSuggestions}
                onContextSelect={handleContextSelect}
                onClose={handleCloseSuggestionBox}
                maxSuggestions={5}
                className="mb-2"
            />

            <form onSubmit={editorContext.operations.handleSubmit}>
                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleContentChange}
                    onKeyDown={handleKeyDown}
                    onSelect={handleSelect}
                    placeholder={
                        editorContext.state.isEditMode
                            ? "Edit your note..."
                            : editorContext.state.chatMode
                            ? `Ask me to find your notes... Start with ${NOTES_COMMAND} to return to your notes!`
                            : `Use Markdown to format your notes. Start with ${QA_COMMAND} to ask questions about your notes!`
                    }
                />

                <div className="flex justify-between items-end m-0 mb-1 gap-2">
                    {editorContext.state.isEditMode && note && (
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
                                    onClick={
                                        editorContext.operations.cancelEdit
                                    }
                                    className="flex items-center gap-2 rounded-xl"
                                    size="icon"
                                >
                                    <X strokeWidth={3} size={14} />
                                </Button>
                                <Button
                                    type="button"
                                    onClick={editorContext.operations.saveEdit}
                                    disabled={
                                        editorContext.state.isSubmitting ||
                                        !content.trim()
                                    }
                                    className="flex items-center gap-2 rounded-xl"
                                    size="icon"
                                >
                                    {editorContext.state.isSubmitting ? (
                                        <HashLoader size={14} />
                                    ) : (
                                        <Check strokeWidth={3} size={14} />
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                    {!editorContext.state.isEditMode && (
                        <div className="flex justify-end w-full">
                            <Button
                                type="submit"
                                disabled={
                                    editorContext.state.isSubmitting ||
                                    !content.trim()
                                }
                                className={cn(
                                    "flex items-center gap-2 rounded-xl"
                                )}
                                size="icon"
                            >
                                {editorContext.state.isSubmitting ? (
                                    <HashLoader size={16} />
                                ) : (
                                    <>
                                        {editorContext.state.chatMode ? (
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
