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
    const editingNoteId = useAppSelector((state) => state.ui.editingNoteId); // Get editingNoteId

    // Check if there's a version of this note in the Redux store
    // If so, use that version to ensure edits are reflected in the UI
    const storeNote = useAppSelector((state) =>
        state.notes.notes.find((n) => n.id === note.id)
    );
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
        normal: "text-base",
        small: "text-sm",
        smaller: "text-xs",
    }[textSize];

    return (
        <div
            data-note-id={currentNote.id}
            // onClick={handleCardClick}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            className={cn(
                "px-2 sm:px-4 my-2 rounded-lg relative transition-colors duration-500",
                // isNoteEditing && "ring-1 ring-zinc-300/50 dark:ring-zinc-600/50 my-0"
                isNoteEditing &&
                    "border-l-2 border-dashed border-blue-500 rounded-none"
            )}
        >
            {showCardHeader && <CardHeader note={currentNote} />}

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
