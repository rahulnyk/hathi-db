"use client";

import { useEffect, useRef } from "react";
// import clsx from "clsx";
import { HashLoader } from "react-spinners";
import { NoteCard } from "./note_card/notes-card";
import { AiNoteCard } from "./note_card/ai-note-card"; // Import AiNoteCard
import { TodoNoteCard } from "./note_card/todo-note-card"; // Import TodoNoteCard
import { useAppDispatch, useAppSelector } from "@/store";
import {
    fetchNotes,
    selectIsLoadingForCurrentContext,
} from "@/store/notesSlice";

export function Thread() {
    // const user = useContext(UserContext);
    const dispatch = useAppDispatch();
    const {
        notes,
        collectionStatus,
        collectionError,
        currentContext,
        notesContext,
    } = useAppSelector((state) => state.notes);
    const { isNavigatingToContext } = useAppSelector((state) => state.ui);
    const isLoadingForCurrentContext = useAppSelector(
        selectIsLoadingForCurrentContext
    );
    const threadContainerRef = useRef<HTMLDivElement>(null);
    const prevNotesLengthRef = useRef(notes.length);

    // Fetch notes only when needed (context changed and we don't have notes for it)
    useEffect(() => {
        // Only fetch if we don't already have notes for the current context
        if (notesContext !== currentContext) {
            dispatch(fetchNotes({ contexts: [currentContext] }));
        }
    }, [dispatch, currentContext, notesContext]);

    useEffect(() => {
        if (
            threadContainerRef.current &&
            notes.length > prevNotesLengthRef.current
        ) {
            const element = threadContainerRef.current;
            element.scrollTop = element.scrollHeight;
        }
        prevNotesLengthRef.current = notes.length;
    }, [notes]);

    // Show loading spinner when navigating to a new context or when notes don't match current context
    if (isNavigatingToContext || isLoadingForCurrentContext) {
        return (
            <div className="w-full flex-grow overflow-y-auto no-scrollbar p-4 md:p-6 flex items-center justify-center">
                <div
                    className="flex items-center gap-3 text-muted-foreground"
                    role="status"
                    aria-live="polite"
                >
                    {/* <span className="text-sm">Loading notes...</span> */}
                    <HashLoader size={20} color="currentColor" loading={true} />
                    <HashLoader size={20} color="currentColor" loading={true} />
                </div>
            </div>
        );
    }

    // Show error state
    if (collectionStatus === "failed") {
        return (
            <div className="w-full flex-grow overflow-y-auto p-4 md:p-6 flex items-center justify-center">
                <div className="text-center p-4 border rounded-lg text-red-500 bg-card">
                    Error loading notes: {collectionError}
                </div>
            </div>
        );
    }

    // Reverse notes for chat-like display (oldest at top, newest at bottom)
    const reversedNotes = [...notes].reverse();

    return (
        <div
            ref={threadContainerRef}
            className="w-full flex-grow overflow-y-auto px-4 md:px-6 py-8 md:py-10 smooth-scroll"
        >
            {reversedNotes.length === 0 ? (
                <div className="flex-grow flex items-center justify-center h-full">
                    <div className="max-w-md mx-auto space-y-8 opacity-70">
                        {/* Help Cards */}
                        <div className="space-y-4">
                            <div className="group hover:bg-muted/20 rounded-lg p-3 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="text-lg">🚀</div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground/70">
                                            Quick Commands
                                        </p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Type{" "}
                                            <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">
                                                qq
                                            </code>{" "}
                                            for assistant mode{" "}
                                            <span className="mx-1">or</span>
                                            <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">
                                                nn
                                            </code>{" "}
                                            for notes mode.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group hover:bg-muted/20 rounded-lg p-3 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="text-lg">🏷️</div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground/70">
                                            Organize with Contexts
                                        </p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Convert any word or phrase into a
                                            context like{" "}
                                            <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">
                                                [[work]]
                                            </code>{" "}
                                            or{" "}
                                            <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">
                                                [[Project Awesome]]
                                            </code>{" "}
                                            to categorize your notes.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group hover:bg-muted/20 rounded-lg p-3 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="text-lg">✅</div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground/70">
                                            Smart Todos
                                        </p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Just start a note with
                                            &quot;todo&quot;, &quot;task&quot;,
                                            or &quot;remind me&quot; and Hathi
                                            will create tasks automatically.
                                            Mention
                                            <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">
                                                today, tomorrow, next week
                                            </code>
                                            , etc. to automatically set due
                                            dates.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group hover:bg-muted/20 rounded-lg p-3 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="text-lg">🎨</div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground/70">
                                            Format your notes with Markdown
                                        </p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Style with{" "}
                                            <strong className="text-foreground/60">
                                                **bold**
                                            </strong>
                                            ,{" "}
                                            <em className="text-foreground/60">
                                                *italic*
                                            </em>
                                            ,{" "}
                                            <code className="bg-primary/10 text-primary px-1 py-0.5 rounded text-xs font-mono">
                                                `code`
                                            </code>
                                            ,{" "}
                                            <span className="text-foreground/60 font-semibold">
                                                # headings
                                            </span>
                                            , and{" "}
                                            <span className="text-foreground/60">
                                                - bullet lists
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {reversedNotes.map((note) => {
                        const cardKey = `${note.id}-${
                            note.isSearchResult || "default"
                        }`;
                        if (note.note_type === "ai-note") {
                            return <AiNoteCard key={cardKey} note={note} />;
                        } else if (note.note_type === "todo") {
                            return <TodoNoteCard key={cardKey} note={note} />;
                        } else {
                            return <NoteCard key={cardKey} note={note} />;
                        }
                    })}
                </div>
            )}
        </div>
    );
}
