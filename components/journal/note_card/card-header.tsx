"use client";

import { Note, deleteNote, markNoteAsDeleting } from "@/store/notesSlice";
import {
    MoreVertical,
    Trash2,
    Loader2,
    Sparkles,
    Check,
    Undo,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    structurizeNoteThunk,
    acceptStructurizedNoteThunk,
    rejectStructurizedNoteThunk,
} from "@/store/aiSlice";

interface CardHeaderProps {
    note: Note;
}

export function CardHeader({ note }: CardHeaderProps) {
    const dispatch = useAppDispatch();
    const aiStructurizedState = useAppSelector(
        (state) => state.ai.structurizedNote[note.id]
    );
    const handleDelete = () => {
        // Mark as deleting first (optimistic update)
        dispatch(markNoteAsDeleting(note.id));

        // Then try to actually delete it
        dispatch(
            deleteNote({
                noteId: note.id,
            })
        );
    };

    const handleStructurize = () => {
        dispatch(
            structurizeNoteThunk({
                noteId: note.id,
                content: note.content,
            })
        );
    };

    const handleAcceptStructurize = () => {
        if (!aiStructurizedState?.structuredContent) return;

        dispatch(
            acceptStructurizedNoteThunk({
                noteId: note.id,
                structuredContent: aiStructurizedState.structuredContent,
            })
        );
    };

    const handleRejectStructurize = () => {
        if (!aiStructurizedState) return;

        dispatch(
            rejectStructurizedNoteThunk({
                noteId: note.id,
            })
        );
    };
    return (
        <>
            <div className="text-xs text-muted-foreground/50 mb-2">
                {new Date(note.created_at).toLocaleString()}
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-1">
                {/* Date display */}
                {/* Structurize button - show when not in preview mode and not editing */}
                {!(
                    aiStructurizedState?.status === "succeeded" &&
                    aiStructurizedState.structuredContent
                ) && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full opacity-70 hover:opacity-100"
                        onClick={handleStructurize}
                        disabled={aiStructurizedState?.status === "loading"}
                        title="Structurize note with AI"
                    >
                        {aiStructurizedState?.status === "loading" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-zinc-500 dark:text-zinc-300" />
                        ) : (
                            <Sparkles className="h-4 w-4 text-zinc-500 dark:text-zinc-300" />
                        )}
                        <span className="sr-only">Structurize note</span>
                    </Button>
                )}
                {/* Accept/Reject buttons - show when in preview mode and not editing */}
                {aiStructurizedState?.status === "succeeded" &&
                    aiStructurizedState.structuredContent && (
                        <>
                            <div className="text-xs text-muted-foreground px-2 rounded whitespace-nowrap flex items-center gap-1">
                                <span>✨ Structured preview - click</span>
                                <Check className="h-3 w-3 inline" />
                                <span>to save or</span>
                                <Undo className="h-3 w-3 inline" />
                                <span>to revert</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full opacity-60 hover:opacity-100"
                                onClick={handleAcceptStructurize}
                                title="Accept structured content"
                            >
                                <Check className="h-4 w-4 text-zinc-800 dark:text-zinc-200" />
                                <span className="sr-only">
                                    Accept structured content
                                </span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full opacity-60 hover:opacity-100"
                                onClick={handleRejectStructurize}
                                title="Revert to original content"
                            >
                                <Undo className="h-4 w-4 text-zinc-800 dark:text-zinc-200" />
                                <span className="sr-only">
                                    Revert to original content
                                </span>
                            </Button>
                        </>
                    )}
                {/* More options dropdown in top right */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full opacity-70 hover:opacity-100"
                            disabled={note.isEditing}
                        >
                            <MoreVertical className="h-4 w-4 text-zinc-500 dark:text-zinc-300" />
                            <span className="sr-only">More options</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                            onClick={handleDelete}
                            className="text-destructive flex items-center cursor-pointer"
                            disabled={note.persistenceStatus === "deleting"}
                        >
                            {note.persistenceStatus === "deleting" ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            {note.persistenceStatus === "deleting"
                                ? "Deleting..."
                                : "Delete Note"}
                        </DropdownMenuItem>
                        {/* Additional actions can be added here in the future */}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    );
}
