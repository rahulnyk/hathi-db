"use client";

import { Note, deleteNote, markNoteAsDeleting } from "@/store/notesSlice";
import ReactMarkdown from "react-markdown";
import { AlertCircle, MoreVertical, Trash2, Loader2 } from "lucide-react";
import remarkGfm from "remark-gfm";
import { useAppDispatch } from "@/store";
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
import { useEffect } from "react";
import { sentenceCaseToSlug } from "@/lib/utils";
import { setCurrentContext } from "@/store/notesSlice";

export function NoteCard({ note, user }: { note: Note; user: User | null }) {
    const dispatch = useAppDispatch();

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
            <div className="absolute top-2 right-2">
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
                <ReactMarkdown
                    remarkPlugins={[
                        remarkGfm,
                        remarkContextPlugin,
                        remarkHashtagPlugin,
                    ]}
                    // components={components}
                >
                    {note.content}
                </ReactMarkdown>
            </div>

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
