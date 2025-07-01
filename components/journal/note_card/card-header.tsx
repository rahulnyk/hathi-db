"use client";

import { Note } from "@/store/notesSlice"; // Removed deleteNote, markNoteAsDeleting
import { Loader2, Sparkles, Check, Undo } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { Button } from "@/components/ui/button";
import { DeleteNoteButton } from "./delete-note-button"; // Import DeleteNoteButton
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

    // Get all user contexts from the store
    const allUserContexts = useAppSelector((state) =>
        state.notesMetadata.contexts.map(ctx => ctx.context)
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
            weekday: "short",
            day: "numeric",
            month: "long",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        };
        return date.toLocaleDateString("en-US", options);
    };

    const handleStructurize = () => {
        dispatch(
            structurizeNoteThunk({
                noteId: note.id,
                content: note.content,
                userContexts: allUserContexts,
            })
        );
    };

    const handleAcceptStructurize = () => {
        if (!aiStructurizedState?.structuredContent) return;

        dispatch(
            acceptStructurizedNoteThunk({
                noteId: note.id,
                structuredContent: aiStructurizedState.structuredContent,
                contexts: note.contexts,
                tags: note.tags,
                noteType: note.note_type || "note",
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
            {/* Header row with date and button group */}
            <div className="flex items-center justify-between mb-0 gap-2">
                {/* Date */}
                <div className="text-xs text-muted-foreground/50 flex-shrink-0">
                    {formatDate(note.created_at)}
                </div>

                {/* Button Group */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Direct Delete Button */}
                    <DeleteNoteButton note={note} />
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
                            <div className="hidden md:flex items-center gap-1">
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
                            </div>
                        )}
                </div>
            </div>

            {/* Accept/Reject buttons for mobile - shown on a new row */}
            {aiStructurizedState?.status === "succeeded" &&
                aiStructurizedState.structuredContent && (
                    <div className="md:hidden flex items-center justify-start gap-2 w-full">
                        <div className="text-xs text-muted-foreground px-2 rounded whitespace-nowrap flex items-center gap-1">
                            <span>✨ AI preview</span>
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
                    </div>
                )}
        </>
    );
}
