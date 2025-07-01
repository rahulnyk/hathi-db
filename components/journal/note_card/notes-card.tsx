"use client";

import { Note } from "@/store/notesSlice"; // Removed enterEditMode
import { setActiveNoteId, setEditingNoteId } from "@/store/uiSlice"; // Import setEditingNoteId
import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";
import { useAppDispatch, useAppSelector } from "@/store";
import remarkContextPlugin from "@/lib/remark_context_plugin";
import remarkHashtagPlugin from "@/lib/remark_hashtag_plugin";

import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { sentenceCaseToSlug } from "@/lib/utils";
import { setCurrentContext } from "@/store/notesSlice";
import {
    generateSuggestedContexts,
    structurizeNoteThunk,
} from "@/store/aiSlice";
import { ContextContainer } from "./context-container";
import { CodeBlock } from "./code-block";
import { NotesEditor } from "../notes_editor";
import { NoteStatusIndicator } from "./note-status-indicator"; // Import the new component
import { CardHeader } from "./card-header";

export function NoteCard({ note }: { note: Note }) {
    const dispatch = useAppDispatch();
    const activeNoteId = useAppSelector((state) => state.ui.activeNoteId);
    const editingNoteId = useAppSelector((state) => state.ui.editingNoteId); // Get editingNoteId

    const aiStructurizedState = useAppSelector(
        (state) => state.ai.structurizedNote[note.id]
    );

    // Get all user contexts from the store
    const allUserContexts = useAppSelector((state) =>
        state.notesMetadata.contexts.map(ctx => ctx.context)
    );

    // Determine if note is of type 'ai-note' (AI notes are handled by AiNoteCard component)
    const isAiNote = note.note_type === "ai-note";
    // Determine if the current note is active
    const isNoteActive = note.id === activeNoteId;
    // Determine if the current note is being edited
    const isNoteEditing = note.id === editingNoteId;

    // Determine if the ContextContainer should be visible
    const showContextContainer = isNoteActive || isNoteEditing;
    // Determine if the CardHeader should be visible
    const showCardHeader = isNoteActive && !isNoteEditing;

    // Determine which content to display
    const displayContent =
        aiStructurizedState?.status === "succeeded" &&
        aiStructurizedState.structuredContent
            ? aiStructurizedState.structuredContent
            : note.content;

    const handleStructurize = () => {
        dispatch(
            structurizeNoteThunk({
                noteId: note.id,
                content: note.content,
                userContexts: allUserContexts,
            })
        );
    };

    const handleCardClick = () => {
        if (isAiNote) {
            return; // Don't allow interaction with AI-generated notes
        }
        if (note.id !== activeNoteId) {
            dispatch(setActiveNoteId(note.id));
        }
    };

    const handleDoubleClick = () => {
        if (isAiNote) {
            return; // Don't allow editing of AI-generated notes
        }
        if (
            note.persistenceStatus === "pending" ||
            note.persistenceStatus === "failed" ||
            isAiNote // Don't allow editing AI notes (they use separate AiNoteCard component)
        ) {
            return; // Don't allow editing of notes that haven't been saved yet or AI notes
        }
        // Dispatch setEditingNoteId instead of enterEditMode
        dispatch(setEditingNoteId(note.id));
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
            data-note-id={note.id}
            onClick={handleCardClick}
            onDoubleClick={handleDoubleClick}
            className={cn(
                "px-2 sm:px-4 my-2 rounded-lg relative transition-colors duration-500",
                isNoteEditing && // Use isNoteEditing here
                    "ring-2 ring-zinc-300 bg-zinc-100 dark:ring-zinc-600 dark:bg-zinc-900/30 my-0",
                isNoteActive &&
                    "border-l-4 border-zinc-300 dark:border-zinc-600 rounded-none my-0"
            )}
        >
            {/* Top right buttons */}
            {showCardHeader && <CardHeader note={note} />}

            {/* Note content - show editor if editing, otherwise show markdown */}
            {isNoteEditing ? ( // Use isNoteEditing here
                <div className="mb-2">
                    <NotesEditor
                        isEditMode={true} // This prop might be redundant now or could signify a specific UI variant
                        noteId={note.id}
                        initialContent={note.content} // Pass initial content for the editor
                    />
                </div>
            ) : (
                <div
                    className="prose prose-sm dark:prose-invert max-w-none mb-2 text-base mt-0 cursor-pointer"
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

            {showContextContainer && <ContextContainer note={note} />}

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
