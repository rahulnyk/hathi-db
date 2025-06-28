"use client";

import React from "react";
import { Note, deleteNote, markNoteAsDeleting } from "@/store/notesSlice";
import { useAppDispatch } from "@/store";
import { Button } from "@/components/ui/button";
import { Trash2Icon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteNoteButtonProps {
    note: Note;
    className?: string; // Allow className to be passed for flexible styling
}

export function DeleteNoteButton({ note, className }: DeleteNoteButtonProps) {
    const dispatch = useAppDispatch();
    const isDeleting = note.persistenceStatus === "deleting";

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this note?")) {
            dispatch(markNoteAsDeleting(note.id));
            dispatch(deleteNote({ noteId: note.id }));
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm" // Default size, can be overridden by specific parent styling if needed
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={isDeleting ? "Deleting note" : "Delete note"}
            className={cn(
                "p-1 h-auto", // Base styling for consistency
                isDeleting
                    ? "text-muted-foreground" // Standard text color for "Deleting..."
                    : "text-red-500 hover:text-red-700", // Red for delete icon
                "h-8 w-8 rounded-full opacity-70 hover:opacity-100 data-[disabled]:opacity-50",
                className // Allow parent to pass additional classes
            )}
            title={isDeleting ? "Deleting..." : "Delete note"}
        >
            {isDeleting ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                </>
            ) : (
                <Trash2Icon size={16} />
            )}
        </Button>
    );
}
