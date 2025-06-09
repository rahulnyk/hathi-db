"use client";

import { useState } from "react";
import { useAppDispatch } from "@/store";
import {
    addNote,
    addNoteOptimistically,
    createOptimisticNote,
} from "@/store/notesSlice";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function NotesEditor({ user }: { user: User }) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useAppDispatch();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);

        // Create optimistic note with "pending" status
        const optimisticNote = createOptimisticNote(content, user.id);

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
            })
        ).finally(() => {
            setIsSubmitting(false);
        });
    };

    return (
        <div className="border rounded p-4 sm:p-6">
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
                        {isSubmitting ? "Saving..." : "Save Note"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
