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
import { setCurrentContext } from "@/store/notesSlice";
import {
    generateSuggestedContexts,
    structurizeNoteThunk,
} from "@/store/aiSlice";
// import { ContextContainer } from "./context-container";
import { CodeBlock } from "./code-block";
import { NotesEditor } from "../notes_editor";
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
    // disableContextContainer = false,
    disableCardHeader = false,
}: NoteCardProps) {
    const dispatch = useAppDispatch();
    const activeNoteId = useAppSelector((state) => state.ui.activeNoteId);
    const editingNoteId = useAppSelector((state) => state.ui.editingNoteId); // Get editingNoteId

    const aiStructurizedState = useAppSelector(
        (state) => state.ai.structurizedNote[note.id]
    );

    // Get all user contexts from the store - memoized in place
    const contexts = useAppSelector((state) => state.notesMetadata.contexts);
    const allUserContexts = useMemo(
        () => contexts.map((ctx) => ctx.context),
        [contexts]
    );

    const isAiNote = note.note_type === "ai-note";
    // const isNoteActive = note.id === activeNoteId;
    const isNoteEditing = note.id === editingNoteId;

    // const showContextContainer =
    //     (isNoteActive || isNoteEditing) && !disableContextContainer;
    const showCardHeader = !isNoteEditing && !disableCardHeader;

    const displayContent =
        aiStructurizedState?.status === "succeeded" &&
        aiStructurizedState.structuredContent
            ? aiStructurizedState.structuredContent
            : note.content;

    // const handleContextsChange = (newContexts: string[]) => {
    //     dispatch(
    //         updateNoteOptimistically({
    //             noteId: note.id,
    //             patches: { contexts: newContexts },
    //         })
    //     );
    // };

    // const handleCardClick = () => {
    //     if (isAiNote) return;
    //     if (note.id !== activeNoteId) {
    //         dispatch(setActiveNoteId(note.id));
    //     }
    // };

    const handleStructurize = () => {
        dispatch(
            structurizeNoteThunk({
                noteId: note.id,
                content: note.content,
                userContexts: allUserContexts,
            })
        );
    };

    const handleDoubleClick = () => {
        console.log(note.persistenceStatus);
        if (isAiNote) return;
        if (note.persistenceStatus !== "persisted") return;
        dispatch(setEditingNoteId(note.id));
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

    const textSizeClass = {
        normal: "text-base",
        small: "text-sm",
        smaller: "text-xs",
    }[textSize];

    return (
        <div
            data-note-id={note.id}
            // onClick={handleCardClick}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            className={cn(
                "px-2 sm:px-4 my-2 rounded-lg relative transition-colors duration-500",
                isNoteEditing &&
                    "ring-1 ring-zinc-300/50 dark:ring-zinc-600/50 my-0"
            )}
        >
            {showCardHeader && <CardHeader note={note} />}

            {isNoteEditing ? (
                <div className="mb-0">
                    <NotesEditor note={note} />
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

            {/* {showContextContainer && !isNoteEditing && (
                <ContextContainer
                    contexts={note.contexts || []}
                    suggestedContexts={note.suggested_contexts || []}
                    onContextsChange={handleContextsChange}
                />
            )} */}

            <NoteStatusIndicator
                note={note}
                onRefreshContextSuggestions={() => {
                    dispatch(
                        generateSuggestedContexts({
                            noteId: note.id,
                            content: note.content,
                            userContexts: allUserContexts,
                        })
                    );
                }}
                onRefreshStructurize={handleStructurize}
            />
        </div>
    );
}
