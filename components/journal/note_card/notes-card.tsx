"use client";

import { Note } from "@/store/notesSlice";
import { setEditingNoteId } from "@/store/uiSlice";
import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";
import { useAppDispatch, useAppSelector } from "@/store";
import remarkContextPlugin from "@/lib/remark_context_plugin";
import remarkHashtagPlugin from "@/lib/remark_hashtag_plugin";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef } from "react";
import { sentenceCaseToSlug } from "@/lib/utils";
import { useContextNavigation } from "@/lib/context-navigation";
import {
    generateSuggestedContexts,
    structurizeNoteThunk,
} from "@/store/aiSlice";
// import { ContextContainer } from "./context-container";
import { CodeBlock } from "./code-block";
import { NotesEditor } from "../editor";
import { NoteStatusIndicator } from "./note-status-indicator";
import { CardHeader } from "./card-header";

export interface NoteCardProps {
    note: Note;
    textSize?: "normal" | "small" | "smaller";
    // disableContextContainer?: boolean;
    disableCardHeader?: boolean;
}

export function NoteCard({
    note,
    textSize = "normal",
    disableCardHeader = false,
}: NoteCardProps) {
    const dispatch = useAppDispatch();
    const { navigateToContext } = useContextNavigation();
    const editingNoteId = useAppSelector((state) => state.ui.editingNoteId);

    // Check if there's a version of this note in the Redux store to ensure edits are reflected
    const storeNote = useAppSelector((state) => {
        const inContext = state.notes.contextNotes.find(
            (n) => n.id === note.id
        );
        if (inContext) return inContext;
        return state.notes.searchResultNotes.find((n) => n.id === note.id);
    });
    const currentNote = storeNote || note;

    const aiStructurizedState = useAppSelector(
        (state) => state.ai.structurizedNote[currentNote.id]
    );

    // Get all user contexts from the store - memoized in place
    const contexts = useAppSelector((state) => state.notesMetadata.contexts);
    const allUserContexts = useMemo(
        () => contexts.map((ctx) => ctx.context),
        [contexts]
    );

    const isAiNote = currentNote.note_type === "ai-note";
    const isNoteEditing = currentNote.id === editingNoteId;

    const showCardHeader = !isNoteEditing && !disableCardHeader;

    const displayContent =
        aiStructurizedState?.status === "succeeded" &&
        aiStructurizedState.structuredContent
            ? aiStructurizedState.structuredContent
            : currentNote.content;

    const handleStructurize = () => {
        dispatch(
            structurizeNoteThunk({
                noteId: currentNote.id,
                content: currentNote.content,
                userContexts: allUserContexts,
            })
        );
    };

    const handleDoubleClick = () => {
        console.log(currentNote.persistenceStatus);
        if (isAiNote) return;
        if (currentNote.persistenceStatus !== "persisted") return;
        dispatch(setEditingNoteId(currentNote.id));
    };

    // Mobile double-tap handling
    const lastTouchTime = useRef(0);
    const touchCount = useRef(0);

    const handleTouchStart = (event: React.TouchEvent) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTouchTime.current;

        if (tapLength < 500 && tapLength > 0) {
            // Double tap detected
            event.preventDefault();
            handleDoubleClick();
        } else {
            // Reset for new tap sequence
            touchCount.current = 1;
        }

        lastTouchTime.current = currentTime;
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
                // Use the context navigation hook to preserve chat state
                navigateToContext(context);
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
    }, [navigateToContext]); // Only navigateToContext is actually used

    const textSizeClass = {
        normal: "text-base text-zinc-900 dark:text-zinc-100",
        small: "text-sm text-zinc-900 dark:text-zinc-100",
        smaller: "text-xs text-zinc-900 dark:text-zinc-100",
    }[textSize];

    return (
        <div
            data-note-id={currentNote.id}
            // onClick={handleCardClick}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            className={cn(
                "border-l-2 px-4 py-2 relative transition-colors duration-500 group",
                isNoteEditing
                    ? "border-dashed border-blue-500 rounded-none"
                    : "border-zinc-200 dark:border-zinc-700"
            )}
        >
            {/* Circle indicator showing edit/save status */}
            <div
                className={cn(
                    "absolute -left-1.5 top-0 w-2.5 h-2.5 rounded-full border-2 bg-background transition-colors duration-300",
                    isNoteEditing
                        ? "border-blue-500"
                        : currentNote.persistenceStatus === "pending"
                        ? "border-orange-500"
                        : currentNote.persistenceStatus === "failed"
                        ? "border-red-500"
                        : "border-zinc-200 dark:border-zinc-700"
                )}
            />
            {showCardHeader && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <CardHeader note={currentNote} />
                </div>
            )}

            {isNoteEditing ? (
                <div className="mb-0">
                    <NotesEditor note={currentNote} />
                </div>
            ) : (
                <div
                    className={cn(
                        "prose prose-sm dark:prose-invert max-w-none mb-2 mt-0 cursor-pointer",
                        textSizeClass
                    )}
                    title="Double-click to edit"
                >
                    <ReactMarkdown
                        remarkPlugins={[
                            remarkGfm,
                            remarkContextPlugin,
                            remarkHashtagPlugin,
                        ]}
                        components={{
                            code: CodeBlock,
                            p: ({ children }) => (
                                <p style={{ whiteSpace: "pre-wrap" }}>
                                    {children}
                                </p>
                            ),
                        }}
                    >
                        {displayContent}
                    </ReactMarkdown>
                </div>
            )}

            <NoteStatusIndicator
                note={currentNote}
                onRefreshContextSuggestions={() => {
                    dispatch(
                        generateSuggestedContexts({
                            noteId: currentNote.id,
                            content: currentNote.content,
                            userContexts: allUserContexts,
                        })
                    );
                }}
                onRefreshStructurize={handleStructurize}
            />
        </div>
    );
}
