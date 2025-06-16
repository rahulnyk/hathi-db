"use client";

import { useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store"; // Import useAppSelector
import {
    addNote,
    addNoteOptimistically,
    createOptimisticNote,
} from "@/store/notesSlice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// import { ArrowDownToLine } from "lucide-react";
// import { ArrowUpToLine } from "lucide-react";
import { ArrowUp } from "lucide-react";
import { HashLoader } from "react-spinners";

import { useContext } from "react";
import { UserContext } from "@/components/journal";

const BRACKET_PAIRS: Record<string, string> = {
    "[": "]",
    "(": ")",
    "{": "}",
    "<": ">",
};

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

export function NotesEditor() {
    const user = useContext(UserContext);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [content, setContent] = useState(""); // This is the source of truth for the textarea's value
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeSelection, setActiveSelection] = useState({
        start: 0,
        end: 0,
    });
    const dispatch = useAppDispatch();
    const currentContext = useAppSelector(
        (state) => state.notes.currentContext
    );

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

        // This function is now simpler.
        // Bracket insertion (enclosing or empty pair) is handled in onKeyDown.
        // Bracket pair deletion is handled in onKeyDown.

        // This handles text changes from:
        // 1. Deletions not caught by onKeyDown (e.g., Delete key, cut, Backspace not on a pair).
        // 2. Normal character typing (non-brackets).
        // 3. Pasting text.
        // 4. IME composition.

        if (newFullValue.length < content.length) {
            // Handles deletions
            setContent(newFullValue);
            setActiveSelection({
                start: newSelectionStart,
                end: newSelectionEnd,
            });
            return;
        }

        // For any other change (additions, modifications not handled by onKeyDown)
        if (newFullValue !== content) {
            setContent(newFullValue);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);

        // Create optimistic note with "pending" status, passing currentContext
        const optimisticNote = createOptimisticNote(
            content,
            user.id,
            currentContext,
            "note"
        );

        // Add to UI immediately
        dispatch(addNoteOptimistically(optimisticNote));

        // Clear input
        setContent("");

        // Then try to persist to server
        dispatch(
            addNote({
                content,
                userId: user.id,
                tempId: optimisticNote.id,
                key_context: optimisticNote.key_context || currentContext, // Pass key_context from optimistic note
                // contexts and tags will default to [] in the thunk if not provided
            })
        ).finally(() => {
            setIsSubmitting(false);
        });
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
                    placeholder="Use Markdown to format your notes: **bold** for emphasis, * for lists, and # for headers. Write `code` between backticks."
                    className="w-full" // Ensure it takes full width
                />
                <div className="flex justify-end m-0 mb-1">
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
                                {/* <ArrowDownToLine className="h-4 w-4 mr-1" /> */}
                                {/* <ArrowUpToLine className="h-4 w-4 mr-1" /> */}
                                <ArrowUp
                                    // className="h-4 w-4"
                                    strokeWidth={3}
                                    size={16}
                                />
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
