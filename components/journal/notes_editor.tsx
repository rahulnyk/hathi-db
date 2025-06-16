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

// Helper function for auto-inserting bracket pairs
function handleAutoInsertBracketPair(
    typedChar: string,
    currentValue: string, // This is the event.target.value
    cursorPosition: number,
    localBracketPairs: Record<string, string>
): { newValue: string; newCursorPosition: number } | null {
    const closingBracket = localBracketPairs[typedChar];
    if (closingBracket) {
        // Simple insertion: assumes no text selected.
        // The full `newValue` from the event already includes the typedChar.
        const textBeforeTypedCharAndCursor = currentValue.substring(
            0,
            cursorPosition
        );
        const textAfterCursor = currentValue.substring(cursorPosition);

        // We need to reconstruct the string to insert the closing bracket
        // The `currentValue` is `textBeforeTypedChar + typedChar + textAfterCursor`
        // So, `textBeforeTypedCharAndCursor` already includes `typedChar` at its end
        const finalValue =
            textBeforeTypedCharAndCursor + closingBracket + textAfterCursor;

        return {
            newValue: finalValue,
            newCursorPosition: cursorPosition, // Cursor stays after the typed opening bracket
        };
    }
    return null;
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

        // If text was deleted by non-Backspace key (e.g., Delete key, or cut)
        // or if Backspace didn't trigger auto-delete pair.
        if (newFullValue.length < content.length) {
            setContent(newFullValue);
            setActiveSelection({
                start: newSelectionStart,
                end: newSelectionEnd,
            });
            return;
        }

        // Handle auto-insertion of a closing bracket if an opening bracket was typed AND no text was selected.
        // The "enclose selected text" feature is now handled in onKeyDown.
        const typedChar =
            newSelectionStart > 0
                ? newFullValue.substring(
                      newSelectionStart - 1,
                      newSelectionStart
                  )
                : "";
        const isOpeningBracketTyped = typedChar && BRACKET_PAIRS[typedChar];

        if (
            isOpeningBracketTyped &&
            activeSelection.start === activeSelection.end && // Ensure no text was selected (handled by onKeyDown now)
            newFullValue.length > content.length
        ) {
            // Ensure it's an insertion

            const insertResult = handleAutoInsertBracketPair(
                typedChar,
                newFullValue,
                newSelectionStart,
                BRACKET_PAIRS
            );

            if (insertResult) {
                setContent(insertResult.newValue);
                requestAnimationFrame(() => {
                    if (textareaRef.current) {
                        textareaRef.current.setSelectionRange(
                            insertResult.newCursorPosition,
                            insertResult.newCursorPosition
                        );
                    }
                });
                return;
            }
        }

        // Default behavior for other text changes (normal typing, pasting, etc.)
        // or if it's an opening bracket but selection was present (handled by onKeyDown)
        // or if auto-pair logic didn't apply.
        if (newFullValue !== content) {
            // Avoid redundant setContent if value hasn't actually changed
            setContent(newFullValue);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const pressedKey = event.key;

        // Handle enclosing selected text when an opening bracket is pressed
        if (
            BRACKET_PAIRS[pressedKey] &&
            activeSelection.start !== activeSelection.end
        ) {
            event.preventDefault();
            const openingBracket = pressedKey;
            const closingBracket = BRACKET_PAIRS[openingBracket];

            const textBefore = content.substring(0, activeSelection.start);
            const selectedText = content.substring(
                activeSelection.start,
                activeSelection.end
            );
            const textAfter = content.substring(activeSelection.end);

            const newValue =
                textBefore +
                openingBracket +
                selectedText +
                closingBracket +
                textAfter;
            setContent(newValue);

            const newSelStart = activeSelection.start + 1;
            const newSelEnd = newSelStart + selectedText.length;

            requestAnimationFrame(() => {
                textareaRef.current?.setSelectionRange(newSelStart, newSelEnd);
                // After programmatically changing content and selection, update activeSelection
                setActiveSelection({ start: newSelStart, end: newSelEnd });
            });
            return;
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
