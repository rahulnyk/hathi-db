"use client";

import { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
    updateNoteOptimistically,
    createNoteOptimistically,
    Note,
} from "@/store/notesSlice";
import { setEditingNoteId } from "@/store/uiSlice";
import { createOptimisticNote, extractMetadata } from "@/lib/noteUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Check } from "lucide-react";
import { HashLoader } from "react-spinners";
import { answerQuestion } from "@/app/actions/qa";
import { useContext } from "react";
import { UserContext } from "@/components/journal";
import { areArraysEqual } from "@/lib/utils";
import { ContextContainer } from "./note_card/context-container";
import { useDebouncedCallback } from "use-debounce";

interface NotesEditorProps {
    note?: Note;
}

const BRACKET_PAIRS: Record<string, string> = {
    "[": "]",
    "(": ")",
    "{": "}",
    "<": ">",
};

// Q&A command constants
const QA_COMMAND = "/q ";
const QA_COMMAND_PATTERN = /^\/q\s+/i;

// New unified helper function for bracket insertion (wrapping selection or empty pair)
function handleBracketInsertion(
    openingBracket: string,
    currentContent: string,
    selection: { start: number; end: number },
    localBracketPairs: Record<string, string>
): { newValue: string; newSelectionStart: number; newSelectionEnd: number } {
    const closingBracket = localBracketPairs[openingBracket];
    // It's assumed openingBracket is a valid key, otherwise closingBracket would be undefined.
    // Robustness: if (!closingBracket) { /* return original or throw error */ }

    const textBefore = currentContent.substring(0, selection.start);
    const selectedText = currentContent.substring(
        selection.start,
        selection.end
    );
    const textAfter = currentContent.substring(selection.end);

    const newValue =
        textBefore + openingBracket + selectedText + closingBracket + textAfter;

    let newSelectionStart: number;
    let newSelectionEnd: number;

    if (selectedText.length > 0) {
        // Text was selected, keep it selected
        newSelectionStart = selection.start + openingBracket.length;
        newSelectionEnd = newSelectionStart + selectedText.length;
    } else {
        // No text selected, cursor goes between brackets
        newSelectionStart = selection.start + openingBracket.length;
        newSelectionEnd = newSelectionStart; // Cursor, not a selection
    }

    return { newValue, newSelectionStart, newSelectionEnd };
}

// Helper function for auto-deleting bracket pairs
function handleAutoDeleteBracketPair(
    currentValue: string,
    cursorPosition: number,
    charBeforeCursor: string,
    localBracketPairs: Record<string, string>
): { newValue: string; newCursorPosition: number } | null {
    const expectedClosingBracket = localBracketPairs[charBeforeCursor];
    if (expectedClosingBracket) {
        const charAfterCursor = currentValue.substring(
            cursorPosition,
            cursorPosition + 1
        );
        if (charAfterCursor === expectedClosingBracket) {
            const textBeforePair = currentValue.substring(
                0,
                cursorPosition - 1
            );
            const textAfterPair = currentValue.substring(cursorPosition + 1);
            return {
                newValue: textBeforePair + textAfterPair,
                newCursorPosition: cursorPosition - 1,
            };
        }
    }
    return null;
}

export function NotesEditor({ note }: NotesEditorProps) {
    const isEditMode = !!note;
    const user = useContext(UserContext);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [content, setContent] = useState(note?.content || "");
    const [contexts, setContexts] = useState(note?.contexts || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeSelection, setActiveSelection] = useState({
        start: 0,
        end: 0,
    });

    const dispatch = useAppDispatch();
    const currentKeyContext = useAppSelector(
        (state) => state.notes.currentContext
    );

    // Sync local state with note prop (one-way: Redux → local state)
    useEffect(() => {
        if (note) {
            setContent(note.content);
            setContexts(note.contexts || []);
        }
    }, [note?.id]); // Only depend on note.id, not the entire note object

    // Debounced dispatch for optimistic updates using use-debounce
    const debouncedDispatch = useDebouncedCallback((patches: any) => {
        if (note) {
            dispatch(
                updateNoteOptimistically({
                    noteId: note.id,
                    patches,
                })
            );
        }
    }, 300); // 300ms debounce

    // Handle content changes with debounced dispatch
    useEffect(() => {
        if (isEditMode && note && content !== note.content) {
            debouncedDispatch({ content });
        }
    }, [content, isEditMode, note?.content, debouncedDispatch]);

    // Handle context changes with debounced dispatch
    useEffect(() => {
        if (
            isEditMode &&
            note &&
            !areArraysEqual(contexts, note.contexts || [])
        ) {
            debouncedDispatch({ contexts });
        }
    }, [contexts, isEditMode, note?.contexts, debouncedDispatch]);

    useEffect(() => {
        if (isEditMode && textareaRef.current) {
            textareaRef.current.focus();
            const length = content.length;
            textareaRef.current.setSelectionRange(length, length);
        }
    }, [isEditMode]);

    const handleSelect = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
        setActiveSelection({
            start: event.currentTarget.selectionStart,
            end: event.currentTarget.selectionEnd,
        });
    };

    const handleContentChange = (
        event: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        const newFullValue = event.target.value;
        const newSelectionStart = event.target.selectionStart;
        const newSelectionEnd = event.target.selectionEnd;

        setContent(newFullValue);

        if (newFullValue.length < content.length) {
            setActiveSelection({
                start: newSelectionStart,
                end: newSelectionEnd,
            });
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const pressedKey = event.key;

        if (BRACKET_PAIRS.hasOwnProperty(pressedKey)) {
            event.preventDefault();

            const result = handleBracketInsertion(
                pressedKey,
                content,
                activeSelection,
                BRACKET_PAIRS
            );

            setContent(result.newValue);

            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.setSelectionRange(
                        result.newSelectionStart,
                        result.newSelectionEnd
                    );
                    setActiveSelection({
                        start: result.newSelectionStart,
                        end: result.newSelectionEnd,
                    });
                }
            });
            return;
        }

        if (pressedKey === "Backspace") {
            const currentValue = content;
            const cursorPosition = event.currentTarget.selectionStart;

            if (cursorPosition === 0) {
                return;
            }

            const charBeforeCursor = currentValue.substring(
                cursorPosition - 1,
                cursorPosition
            );

            const deleteResult = handleAutoDeleteBracketPair(
                currentValue,
                cursorPosition,
                charBeforeCursor,
                BRACKET_PAIRS
            );

            if (deleteResult) {
                event.preventDefault();
                setContent(deleteResult.newValue);
                requestAnimationFrame(() => {
                    if (textareaRef.current) {
                        textareaRef.current.setSelectionRange(
                            deleteResult.newCursorPosition,
                            deleteResult.newCursorPosition
                        );
                    }
                });
                return;
            }
        }
    };

    const handleContextsChange = (newContexts: string[]) => {
        setContexts(newContexts);
    };

    const handleQAQuestion = async () => {
        try {
            const question = content
                .trim()
                .replace(QA_COMMAND_PATTERN, "")
                .trim();

            if (!question) {
                console.error(
                    `No question provided after ${QA_COMMAND} command`
                );
                return;
            }

            const result = await answerQuestion(question);

            if (result.answer) {
                const aiAnswerNote = createOptimisticNote(
                    `**Q:** ${question}\n\n**A:** ${result.answer}`,
                    user.id,
                    currentKeyContext,
                    "ai-note",
                    [],
                    []
                );

                dispatch(
                    createNoteOptimistically({
                        tempNote: aiAnswerNote,
                        autoSave: true,
                    })
                );

                setContent("");
            } else {
                console.error("Failed to get AI answer:", result.error);
            }
        } catch (error) {
            console.error("Error handling Q&A question:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        if (isEditMode) {
            handleSaveEdit();
        } else {
            await handleCreateNote();
        }
    };

    const handleCreateNote = async () => {
        setIsSubmitting(true);

        if (QA_COMMAND_PATTERN.test(content.trim())) {
            await handleQAQuestion();
            return;
        }

        const { contexts: extractedContexts, tags } = extractMetadata(content);
        const mergedContexts = [
            ...new Set([...contexts, ...extractedContexts]),
        ];

        const optimisticNote = createOptimisticNote(
            content,
            user.id,
            currentKeyContext,
            "note",
            mergedContexts,
            tags
        );

        dispatch(
            createNoteOptimistically({
                tempNote: optimisticNote,
                autoSave: true,
            })
        );

        setContent("");
        setContexts([]);
        setIsSubmitting(false);
    };

    const handleSaveEdit = () => {
        if (!note) return;
        // Optimistic update already handled by useEffect
        // Just exit edit mode
        dispatch(setEditingNoteId(null));
    };

    const handleCancelEdit = () => {
        if (!note) return;

        // Revert local state
        setContent(note.content);
        setContexts(note.contexts || []);

        // Exit edit mode
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
                            : `Use Markdown to format your notes: **bold** for emphasis, * for lists, and # for headers. Write \`code\` between backticks. Start with ${QA_COMMAND} to ask questions about your notes!`
                    }
                    className={
                        isEditMode
                            ? "w-full border border-zinc-300 dark:border-zinc-600 focus:ring-0 focus:border-zinc-400 dark:focus:border-zinc-400 bg-transparent"
                            : "w-full"
                    }
                />
                <div className="flex justify-between items-end m-0 mb-1 gap-2">
                    {isEditMode && (
                        <>
                            <ContextContainer
                                contexts={contexts}
                                suggestedContexts={
                                    note.suggested_contexts || []
                                }
                                onContextsChange={handleContextsChange}
                                readOnly={false}
                                className="flex-1"
                            />
                            <div className="flex justify-end items-end pb-2">
                                <Button
                                    type="button"
                                    // variant="ghost"
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
                                className="flex items-center gap-2 rounded-xl"
                                size="icon"
                            >
                                {isSubmitting ? (
                                    <HashLoader size={16} />
                                ) : (
                                    <>
                                        <ArrowUp strokeWidth={3} size={16} />
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
