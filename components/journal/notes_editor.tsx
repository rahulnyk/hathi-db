"use client";

import { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store"; // Import useAppSelector
import { addNote, addNoteOptimistically, patchNote } from "@/store/notesSlice"; // Removed exitEditMode, updateEditingContent
import { setEditingNoteId } from "@/store/uiSlice"; // Import setEditingNoteId
import {
    generateSuggestedContexts,
    generateEmbeddingThunk,
    markAsAIAnswer,
} from "@/store/aiSlice";
import { createOptimisticNote } from "@/lib/noteUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, X, Check } from "lucide-react";
import { HashLoader } from "react-spinners";
import { answerQuestion } from "@/app/actions/qa";

import { useContext } from "react";
import { UserContext } from "@/components/journal";
import { extractMetadata } from "@/lib/noteUtils";
import { areArraysEqual } from "@/lib/utils";

interface NotesEditorProps {
    isEditMode?: boolean;
    noteId?: string;
    initialContent?: string;
    onCancel?: () => void;
    onSave?: () => void;
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

export function NotesEditor({
    isEditMode,
    noteId,
    initialContent,
    onCancel,
    onSave,
}: NotesEditorProps) {
    const user = useContext(UserContext);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [content, setContent] = useState(initialContent || ""); // This is the source of truth for the textarea's value
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeSelection, setActiveSelection] = useState({
        start: 0,
        end: 0,
    });
    const [hasModifications, setHasModifications] = useState(false);
    const [originalContexts, setOriginalContexts] = useState<string[]>([]);
    const hasInitializedRef = useRef(false);
    const initialContentLengthRef = useRef(initialContent?.length || 0);
    const dispatch = useAppDispatch();
    const currentContext = useAppSelector(
        (state) => state.notes.currentContext
    );

    // Get current note data for edit mode
    const currentNote = useAppSelector((state) =>
        noteId ? state.notes.notes.find((note) => note.id === noteId) : null
    );

    // Initialize content when entering edit mode
    useEffect(() => {
        if (
            isEditMode &&
            initialContent !== undefined &&
            !hasInitializedRef.current
        ) {
            setContent(initialContent);
            setHasModifications(false);
            // Store original contexts when entering edit mode
            setOriginalContexts(currentNote?.contexts || []);
            initialContentLengthRef.current = initialContent.length;
            hasInitializedRef.current = true;
        } else if (!isEditMode) {
            hasInitializedRef.current = false;
        }
    }, [isEditMode, initialContent, currentNote?.contexts]);

    // Check for modifications when content or contexts change
    useEffect(() => {
        if (isEditMode && initialContent !== undefined) {
            const contentModified = content !== initialContent;
            const contextsModified = !areArraysEqual(
                currentNote?.contexts || [],
                originalContexts
            );
            setHasModifications(contentModified || contextsModified);
        }
    }, [
        content,
        initialContent,
        isEditMode,
        currentNote?.contexts,
        originalContexts,
    ]);

    // Focus textarea when entering edit mode
    useEffect(() => {
        if (isEditMode && textareaRef.current) {
            textareaRef.current.focus();
            // Set cursor to end of content
            const length = initialContentLengthRef.current;
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

        // Update local state
        setContent(newFullValue);

        if (newFullValue.length < content.length) {
            // Handles deletions
            setActiveSelection({
                start: newSelectionStart,
                end: newSelectionEnd,
            });
            return;
        }

        // For any other change (additions, modifications not handled by onKeyDown)
        if (newFullValue !== content) {
            // activeSelection will be updated by the onSelect handler naturally.
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const pressedKey = event.key;

        // If an opening bracket is pressed (e.g., '[', '(', '{')
        if (BRACKET_PAIRS.hasOwnProperty(pressedKey)) {
            event.preventDefault(); // Prevent default character insertion

            const result = handleBracketInsertion(
                pressedKey,
                content, // Current content from state
                activeSelection, // Current selection from state {start, end}
                BRACKET_PAIRS
            );

            setContent(result.newValue);

            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.setSelectionRange(
                        result.newSelectionStart,
                        result.newSelectionEnd
                    );
                    // Update activeSelection state to keep it synchronized
                    setActiveSelection({
                        start: result.newSelectionStart,
                        end: result.newSelectionEnd,
                    });
                }
            });
            return; // Bracket insertion handled
        }

        // Handle auto-deletion of bracket pairs on Backspace
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
        // Default behavior for other keys or if auto-delete didn't apply
    };

    const handleQAQuestion = async () => {
        try {
            // Extract the question by removing the command prefix using the pattern
            const question = content.trim().replace(QA_COMMAND_PATTERN, '').trim();
            
            if (!question) {
                console.error(`No question provided after ${QA_COMMAND} command`);
                return;
            }

            // Call the Q&A action
            const result = await answerQuestion(question);
            
            if (result.answer) {
                // Format sources section if there are relevant sources
                let sourcesSection = "";
                if (result.relevantSources && result.relevantSources.length > 0) {
                    const sourceLinks = result.relevantSources
                        .map(noteId => `[Note ${noteId.slice(-8)}](#note-${noteId})`)
                        .join(", ");
                    sourcesSection = `\n\n**Sources:** ${sourceLinks}`;
                }

                // Create an AI answer note that appears in the timeline
                const aiAnswerNote = createOptimisticNote(
                    `**Q:** ${question}\n\n**A:** ${result.answer}${sourcesSection}`,
                    user.id,
                    currentContext,
                    "ai-note", // Use AI note type to identify AI answers
                    [], // No contexts extracted from AI answers
                    [] // No special tags needed
                );

                // Add the AI answer to the timeline
                dispatch(addNoteOptimistically(aiAnswerNote));
                
                // Mark this note as an AI answer in the AI slice
                dispatch(markAsAIAnswer({
                    noteId: aiAnswerNote.id,
                    question: question,
                    answer: result.answer,
                    relevantSources: result.relevantSources
                }));
                
                // Clear the input
                setContent("");
            } else {
                console.error('Failed to get AI answer:', result.error);
                // Could show an error message to the user here
            }
        } catch (error) {
            console.error('Error handling Q&A question:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        if (isEditMode && noteId) {
            // Handle edit mode save
            await handleSaveEdit();
        } else {
            // Handle create mode
            await handleCreateNote();
        }
    };

    const handleCreateNote = async () => {
        setIsSubmitting(true);

        // Check if this is a Q&A question using the pattern
        if (QA_COMMAND_PATTERN.test(content.trim())) {
            await handleQAQuestion();
            return;
        }

        // extract contexts and tags from the note content
        const { contexts, tags } = extractMetadata(content);

        // Create optimistic note with "pending" status, passing currentContext
        const optimisticNote = createOptimisticNote(
            content,
            user.id, // TODO Remove this and have server action automatically add user id.
            currentContext,
            "note",
            contexts,
            tags
        );

        // Add to UI immediately
        dispatch(addNoteOptimistically(optimisticNote));

        // Clear input
        setContent("");

        // Then try to persist to server
        const addNoteResult = await dispatch(
            addNote({
                tempId: optimisticNote.id,
                key_context: currentContext, // Ensure key_context is set
                ...optimisticNote,
            })
        );

        // If note was successfully added, generate context suggestions and embedding
        if (addNote.fulfilled.match(addNoteResult)) {
            const persistedNote = addNoteResult.payload.note;

            // Fire-and-forget: Dispatch context suggestions generation
            // NoteCard will handle the AI state management
            dispatch(
                generateSuggestedContexts({
                    noteId: persistedNote.id,
                    content: persistedNote.content,
                })
            );

            // Fire-and-forget: Dispatch embedding generation
            // NoteCard will handle the AI state management
            dispatch(
                generateEmbeddingThunk({
                    noteId: persistedNote.id,
                    content: persistedNote.content,
                })
            );
        }

        setIsSubmitting(false);
    };

    const handleSaveEdit = async () => {
        if (!noteId) return;

        setIsSubmitting(true);

        try {
            // Extract new contexts and tags from the updated content
            const { contexts: newContexts, tags: newTags } =
                extractMetadata(content);

            // Merge existing contexts with new ones, removing duplicates
            const existingContexts = currentNote?.contexts || [];
            const mergedContexts = [
                ...new Set([...existingContexts, ...newContexts]),
            ];

            // Merge existing tags with new ones, removing duplicates
            const existingTags = currentNote?.tags || [];
            const mergedTags = [...new Set([...existingTags, ...newTags])];

            // Send patch request to server FIRST
            await dispatch(
                patchNote({
                    noteId,
                    patches: {
                        content,
                        contexts: mergedContexts,
                        tags: mergedTags,
                    },
                })
            );

            // Only exit edit mode AFTER successful save
            dispatch(setEditingNoteId(null));

            // Call onSave callback if provided
            if (onSave) {
                onSave();
            }
        } catch (error) {
            console.error("Error saving note:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelEdit = () => {
        if (!noteId) return;

        // Reset content to original (initialContent prop)
        if (initialContent !== undefined) {
            setContent(initialContent);
        }
        // Dispatch setEditingNoteId(null) to exit edit mode
        dispatch(setEditingNoteId(null));

        // Call onCancel callback if provided
        if (onCancel) {
            onCancel();
        }
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
                            ? "Edit your note content..."
                            : `Use Markdown to format your notes: **bold** for emphasis, * for lists, and # for headers. Write \`code\` between backticks. Start with ${QA_COMMAND} to ask questions about your notes!`
                    }
                    className={
                        isEditMode
                            ? "w-full border border-zinc-300 dark:border-zinc-600 focus:ring-0 focus:border-zinc-400 dark:focus:border-zinc-400 bg-transparent"
                            : "w-full"
                    }
                />
                <div className="flex justify-end m-0 mb-1 gap-2">
                    {isEditMode ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={isSubmitting}
                                className={`flex items-center gap-2 rounded-xl ${
                                    hasModifications
                                        ? "text-zinc-700 dark:text-zinc-100"
                                        : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-100"
                                }`}
                                size="sm"
                            >
                                <X strokeWidth={3} className="h-4 w-4" />
                                <span>Cancel</span>
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !content.trim()}
                                className={`flex items-center gap-2 rounded-xl ${
                                    hasModifications
                                        ? "bg-zinc-600 dark:bg-zinc-100"
                                        : "bg-zinc-500 hover:bg-zinc-600 dark:bg-zinc-500 dark:hover:bg-zinc-100"
                                }`}
                                size="sm"
                            >
                                {isSubmitting ? (
                                    <HashLoader size={16} />
                                ) : (
                                    <>
                                        <Check
                                            strokeWidth={3}
                                            className="h-4 w-4"
                                        />
                                        <span>Save</span>
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
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
                    )}
                </div>
            </form>
        </div>
    );
}
