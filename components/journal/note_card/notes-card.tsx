"use client";

import { Note, enterEditMode } from "@/store/notesSlice";
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

    const aiStructurizedState = useAppSelector(
        (state) => state.ai.structurizedNote[note.id]
    );

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
            })
        );
    };

    const handleDoubleClick = () => {
        if (
            note.persistenceStatus === "pending" ||
            note.persistenceStatus === "failed"
        ) {
            return; // Don't allow editing of notes that haven't been saved yet
        }

        dispatch(
            enterEditMode({
                noteId: note.id,
                originalContent: note.content,
            })
        );
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
                "p-2 sm:p-4 py-0 rounded-lg relative",
                note.isEditing &&
                    "ring-2 ring-zinc-300 bg-zinc-100 dark:ring-zinc-600 dark:bg-zinc-900/30"
            )}
        >
            {/* Top right buttons */}
            {!note.isEditing && <CardHeader note={note} />}

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

            <NoteStatusIndicator
                note={note}
                onRefreshContextSuggestions={() => {
                    dispatch(
                        generateSuggestedContexts({
                            noteId: note.id,
                            content: note.content,
                        })
                    );
                }}
                onRefreshStructurize={handleStructurize}
            />
        </div>
    );
}
