"use client";

import { Note, deleteNote, markNoteAsDeleting, enterEditMode } from "@/store/notesSlice";
import ReactMarkdown from "react-markdown";
import {
    AlertCircle,
    MoreVertical,
    Trash2,
    Loader2,
    RefreshCw,
    Sparkles,
    Check,
    Undo,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { sentenceCaseToSlug } from "@/lib/utils";
import { setCurrentContext } from "@/store/notesSlice";
import {
    generateSuggestedContexts,
    structurizeNoteThunk,
    acceptStructurizeNoteThunk,
    rejectStructurizeNoteThunk,
} from "@/store/aiSlice";
import { ContextContainer } from "@/components/journal/context-container";
import { CodeBlock } from "./code-block";
import { NotesEditor } from "./notes_editor";

export function NoteCard({ note }: { note: Note }) {
    const dispatch = useAppDispatch();

    // Get AI state for this specific note only
    const aiSuggestedContexts = useAppSelector(
        (state) => state.ai.suggestedContexts[note.id]
    );
    const aiStructurizeState = useAppSelector(
        (state) => state.ai.structurizeNote[note.id]
    );

    // Determine which content to display
    const displayContent =
        aiStructurizeState?.status === "succeeded" &&
        aiStructurizeState.structuredContent
            ? aiStructurizeState.structuredContent
            : note.content;

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
        if (!aiStructurizeState?.structuredContent) return;

        dispatch(
            acceptStructurizeNoteThunk({
                noteId: note.id,
                structuredContent: aiStructurizeState.structuredContent,
            })
        );
    };

    const handleRejectStructurize = () => {
        if (!aiStructurizeState) return;

        dispatch(
            rejectStructurizeNoteThunk({
                noteId: note.id,
            })
        );
    };

    const handleDoubleClick = () => {
        if (note.persistenceStatus === "pending" || note.persistenceStatus === "failed") {
            return; // Don't allow editing of notes that haven't been saved yet
        }

        dispatch(enterEditMode({
            noteId: note.id,
            originalContent: note.content
        }));
    };

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (target.classList.contains("context-pill-inline")) {
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
                "p-3 sm:p-4 py-2 rounded-lg relative",
                note.isEditing && "ring-2 ring-zinc-300 bg-zinc-100 dark:ring-zinc-600 dark:bg-zinc-900/30"
            )}
        >
            {/* More options dropdown in top right */}
            <div className="absolute top-2 right-2 flex items-center gap-1">
                {/* Structurize button - show when not in preview mode and not editing */}
                {!(
                    aiStructurizeState?.status === "succeeded" &&
                    aiStructurizeState.structuredContent
                ) && !note.isEditing && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full opacity-70 hover:opacity-100"
                        onClick={handleStructurize}
                        disabled={aiStructurizeState?.status === "loading"}
                        title="Structurize note with AI"
                    >
                        {aiStructurizeState?.status === "loading" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-zinc-500 dark:text-zinc-300" />
                        ) : (
                            <Sparkles className="h-4 w-4 text-zinc-500 dark:text-zinc-300" />
                        )}
                        <span className="sr-only">Structurize note</span>
                    </Button>
                )}

                {/* Accept/Reject buttons - show when in preview mode and not editing */}
                {aiStructurizeState?.status === "succeeded" &&
                    aiStructurizeState.structuredContent && !note.isEditing && (
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

            {/* Date display */}
            <div className="text-xs text-muted-foreground mb-2">
                {new Date(note.created_at).toLocaleString()}
            </div>

            {/* Note content - show editor if editing, otherwise show markdown */}
            {note.isEditing ? (
                <div className="mb-2">
                    <NotesEditor
                        isEditMode={true}
                        noteId={note.id}
                        initialContent={note.content}
                    />
                </div>
            ) : (
                <div
                    className="prose prose-sm dark:prose-invert max-w-none mb-2 text-base mt-0 cursor-pointer"
                    onDoubleClick={handleDoubleClick}
                    title="Double-click to edit"
                >
                    <ReactMarkdown
                        remarkPlugins={[
                            remarkGfm,
                            remarkContextPlugin,
                            remarkHashtagPlugin,
                        ]}
                        components={{
                            code: CodeBlock, // Use custom CodeBlock component
                            // Add any other custom components here if needed
                        }}
                    >
                        {displayContent}
                    </ReactMarkdown>
                </div>
            )}

            <ContextContainer note={note} />

            {/* Context suggestions loading/error states and refresh button when no suggestions */}
            {aiSuggestedContexts && !note.suggested_contexts?.length && !note.isEditing &&
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {aiSuggestedContexts.status === "loading" && (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Generating context suggestions...</span>
                            </>
                        )}
                        {aiSuggestedContexts.status === "failed" && (
                            <>
                                <AlertCircle className="h-3 w-3" />
                                <span>
                                    Failed to generate suggestions:{" "}
                                    {aiSuggestedContexts.error}
                                </span>
                            </>
                        )}
                    </div>
                    {aiSuggestedContexts.status === "failed" && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                                dispatch(
                                    generateSuggestedContexts({
                                        noteId: note.id,
                                        content: note.content,
                                    })
                                );
                            }}
                        >
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            }

            {/* Show loading state for newly created notes that don't have AI state yet */}
            {!aiSuggestedContexts &&
                !note.suggested_contexts?.length &&
                note.persistenceStatus === "persisted" && !note.isEditing && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Generating context suggestions...</span>
                    </div>
                )}

            {/* Structurization error state */}
            {aiStructurizeState?.status === "failed" && (
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        <span>
                            Failed to structurize note:{" "}
                            {aiStructurizeState.error}
                        </span>
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

            {/* Show persistence status for notes that failed to save or are being deleted */}
            {(note.persistenceStatus === "failed" ||
                note.persistenceStatus === "deleting") && !note.isEditing && (
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
