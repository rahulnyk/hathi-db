"use client";

import { Note, deleteNote, markNoteAsDeleting, patchNote } from "@/store/notesSlice";
import ReactMarkdown from "react-markdown";
import { AlertCircle, MoreVertical, Trash2, Loader2, Plus, RefreshCw, Sparkles, Check, Undo } from "lucide-react";
import remarkGfm from "remark-gfm";
import { useAppDispatch, useAppSelector } from "@/store";
// import { useUser } from "@/components/auth/user-provider";
import remarkContextPlugin from "@/lib/remark_context_plugin";
import remarkHashtagPlugin from "@/lib/remark_hashtag_plugin";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { sentenceCaseToSlug } from "@/lib/utils";
import { setCurrentContext } from "@/store/notesSlice";
import { generateSuggestedContexts, structurizeNoteThunk, acceptStructurizeNoteThunk, rejectStructurizeNoteThunk } from "@/store/aiSlice";

export function NoteCard({ note, user }: { note: Note; user: User | null }) {
    const dispatch = useAppDispatch();

    // Get AI state for this specific note only
    const aiState = useAppSelector((state) => state.ai.suggestedContexts[note.id]);
    const structurizeState = useAppSelector((state) => state.ai.structurizeNote[note.id]);

    // Track which suggested context is being added
    const [addingContext, setAddingContext] = useState<string | null>(null);

    // Determine which content to display
    const displayContent = structurizeState?.status === "succeeded" && structurizeState.structuredContent
        ? structurizeState.structuredContent
        : note.content;

    const handleDelete = () => {
        if (!user) return;

        // Mark as deleting first (optimistic update)
        dispatch(markNoteAsDeleting(note.id));

        // Then try to actually delete it
        dispatch(
            deleteNote({
                noteId: note.id,
                userId: user.id,
            })
        );
    };

    const handleStructurize = () => {
        if (!user) return;

        dispatch(
            structurizeNoteThunk({
                noteId: note.id,
                content: note.content,
            })
        );
    };

    const handleAcceptStructurize = () => {
        if (!user || !structurizeState?.structuredContent) return;

        dispatch(
            acceptStructurizeNoteThunk({
                noteId: note.id,
                structuredContent: structurizeState.structuredContent,
                userId: user.id,
            })
        );
    };

    const handleRejectStructurize = () => {
        if (!structurizeState) return;

        dispatch(
            rejectStructurizeNoteThunk({
                noteId: note.id,
            })
        );
    };

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (target.classList.contains("context-pill")) {
                const content =
                    target.getAttribute("data-content") ||
                    target.textContent ||
                    "";
                const context = sentenceCaseToSlug(content);
                // Dispatch action to set current context
                dispatch(setCurrentContext(context));
                console.log("Context clicked:", context);
            }

            if (target.classList.contains("hashtag-pill")) {
                const content =
                    target.getAttribute("data-content") ||
                    target.textContent?.replace("#", "") ||
                    "";
                console.log("Hashtag clicked:", content);
            }
        };

        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [dispatch]);

    return (
        <div
            className={cn(
                "p-3 sm:p-4 py-2 rounded-lg relative"
                // "bg-muted/40 dark:bg-muted/20"
            )}
        >
            {/* More options dropdown in top right */}
            <div className="absolute top-2 right-2 flex items-center gap-1">
                {/* Structurize button - show when not in preview mode */}
                {!(structurizeState?.status === "succeeded" && structurizeState.structuredContent) && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full opacity-70 hover:opacity-100"
                        onClick={handleStructurize}
                        disabled={structurizeState?.status === "loading"}
                        title="Structurize note with AI"
                    >
                        {structurizeState?.status === "loading" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-zinc-500 dark:text-zinc-300" />
                        ) : (
                            <Sparkles className="h-4 w-4 text-zinc-500 dark:text-zinc-300" />
                        )}
                        <span className="sr-only">Structurize note</span>
                    </Button>
                )}

                {/* Accept/Reject buttons - show when in preview mode */}
                {structurizeState?.status === "succeeded" && structurizeState.structuredContent && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full opacity-70 hover:opacity-100 text-green-600 dark:text-green-400"
                            onClick={handleAcceptStructurize}
                            title="Accept structured content"
                        >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Accept structured content</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full opacity-70 hover:opacity-100 text-red-600 dark:text-red-400"
                            onClick={handleRejectStructurize}
                            title="Revert to original content"
                        >
                            <Undo className="h-4 w-4" />
                            <span className="sr-only">Revert to original content</span>
                        </Button>
                    </>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full opacity-70 hover:opacity-100"
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

            {/* Date display */}
            <div className="text-xs text-muted-foreground mb-2">
                {new Date(note.created_at).toLocaleString()}
            </div>

            {/* Note content */}
            <div className="prose prose-sm dark:prose-invert max-w-none mb-2 text-base">
                {structurizeState?.status === "succeeded" && structurizeState.structuredContent && (
                    <div className="mb-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                        ✨ Showing structured preview - click ✓ to save or ↶ to revert
                    </div>
                )}
                <ReactMarkdown
                    remarkPlugins={[
                        remarkGfm,
                        remarkContextPlugin,
                        remarkHashtagPlugin,
                    ]}
                    // components={components}
                >
                    {displayContent}
                </ReactMarkdown>
            </div>

            {/* Actual contexts */}
            {note.contexts && note.contexts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                    {note.contexts.map((context, index) => (
                        <span
                            key={index}
                            className="context-pill"
                        >
                            {context}
                        </span>
                    ))}
                </div>
            )}

            {/* Suggested contexts */}
            {note.suggested_contexts && note.suggested_contexts.length > 0 && (
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                        {note.suggested_contexts
                            .filter(context => !note.contexts?.includes(context))
                            .map((context, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="suggested-context-pill h-6 px-2 text-xs rounded-lg"
                                onClick={() => {
                                    if (!user) return;

                                    // Set loading state for this context
                                    setAddingContext(context);

                                    // Add this context to the note's contexts
                                    const updatedContexts = [...(note.contexts || []), context];
                                    dispatch(
                                        patchNote({
                                            noteId: note.id,
                                            patches: {
                                                contexts: updatedContexts,
                                            },
                                            userId: user.id,
                                        })
                                    ).finally(() => {
                                        // Clear loading state when request completes
                                        setAddingContext(null);
                                    });
                                }}
                                disabled={addingContext === context}
                            >
                                {addingContext === context ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <>
                                        {context}
                                        <Plus className="h-3 w-3" />
                                    </>
                                )}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Context suggestions loading/error states and refresh button when no suggestions */}
            {aiState && !note.suggested_contexts?.length && (
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {aiState.status === "loading" && (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Generating context suggestions...</span>
                            </>
                        )}
                        {aiState.status === "failed" && (
                            <>
                                <AlertCircle className="h-3 w-3" />
                                <span>Failed to generate suggestions: {aiState.error}</span>
                            </>
                        )}
                    </div>
                    {aiState.status === "failed" && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                                if (!user) return;
                                dispatch(
                                    generateSuggestedContexts({
                                        noteId: note.id,
                                        content: note.content,
                                        userId: user.id,
                                    })
                                );
                            }}
                        >
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            )}

            {/* Show loading state for newly created notes that don't have AI state yet */}
            {!aiState && !note.suggested_contexts?.length && note.persistenceStatus === "persisted" && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Generating context suggestions...</span>
                </div>
            )}

            {/* Structurization error state */}
            {structurizeState?.status === "failed" && (
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        <span>Failed to structurize note: {structurizeState.error}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={handleStructurize}
                    >
                        <RefreshCw className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Status indicator pill at bottom */}
            {(note.persistenceStatus === "failed" ||
                note.persistenceStatus === "deleting") && (
                <div
                    className={`
                    mt-2 text-xs rounded-full px-2 py-1 inline-flex items-center gap-1
                    ${
                        note.persistenceStatus === "failed"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : ""
                    }
                    ${
                        note.persistenceStatus === "deleting"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : ""
                    }
                `}
                >
                    {note.persistenceStatus === "failed" && (
                        <>
                            <AlertCircle className="h-3 w-3" />
                            <span>
                                {note.errorMessage || "Failed to save note"}
                            </span>
                        </>
                    )}
                    {note.persistenceStatus === "deleting" && (
                        <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Deleting note...</span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
