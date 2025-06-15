"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store"; // Import useAppSelector
import {
    addNote,
    addNoteOptimistically,
    createOptimisticNote,
} from "@/store/notesSlice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDownToLine } from "lucide-react";

import { useContext } from "react";
import { UserContext } from "@/components/journal";
export function NotesEditor() {
    const user = useContext(UserContext);

    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useAppDispatch();
    // Get currentContext from the Redux store
    const currentContext = useAppSelector(
        (state) => state.notes.currentContext
    );

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
        <div className="rounded-lg p-0">
            <form onSubmit={handleSubmit}>
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Use Markdown to format your notes: **bold** for emphasis, * for lists, and # for headers. Write `code` between backticks."
                    className="w-full" // Ensure it takes full width
                />
                <div className="flex flex-col sm:flex-row sm:justify-end items-center mt-4">
                    <Button
                        type="submit"
                        disabled={isSubmitting || !content.trim()}
                        className="flex items-center gap-2 w-full sm:w-auto"
                    >
                        {isSubmitting ? (
                            "Saving..."
                        ) : (
                            <>
                                <ArrowDownToLine className="h-4 w-4 mr-1" />
                                Save Note
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
