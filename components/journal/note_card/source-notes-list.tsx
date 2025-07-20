"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAppSelector } from "@/store";
import { getAIAnswerDetails } from "@/store/aiSlice";
import { CollapsibleSourceNote } from "./collapsible-source-note";
import { cn } from "@/lib/utils";
import { Note } from "@/store/notesSlice";
import { fetchNotesByIds } from "@/app/actions/notes";

interface SourceNotesListProps {
    aiNoteId: string;
    className?: string;
}

export function SourceNotesList({ aiNoteId, className }: SourceNotesListProps) {
    // Get AI answer details to access source note IDs
    const aiAnswerDetails = useAppSelector((state) =>
        getAIAnswerDetails(state, aiNoteId)
    );

    // Get notes currently loaded in Redux state
    const notesInState = useAppSelector((state) => state.notes.notes);

    // State to hold source notes (including fetched ones)
    const [sourceNotes, setSourceNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Memoize source note IDs to prevent unnecessary re-renders
    const sourceNoteIds = useMemo(() => {
        return aiAnswerDetails?.relevantSources || [];
    }, [aiAnswerDetails?.relevantSources]);

    // Memoize relevant notes from state to prevent unnecessary effect runs
    const relevantNotesFromState = useMemo(() => {
        return sourceNoteIds
            .map((id) => notesInState.find((note) => note.id === id))
            .filter((note): note is Note => note !== undefined);
    }, [sourceNoteIds, notesInState]);

    // Memoize note IDs for stable dependency
    const noteIdsInState = useMemo(() => {
        return notesInState.map((note) => note.id).join(",");
    }, [notesInState]);

    // Effect to fetch missing source notes
    useEffect(() => {
        if (sourceNoteIds.length === 0) {
            setSourceNotes([]);
            return;
        }

        // Find missing note IDs
        const missingNoteIds = sourceNoteIds.filter(
            (id) => !relevantNotesFromState.find((note) => note.id === id)
        );

        if (missingNoteIds.length === 0) {
            // All notes are already in state
            setSourceNotes(relevantNotesFromState);
            return;
        }

        // Set notes from state immediately, then fetch missing ones
        setSourceNotes(relevantNotesFromState);

        // Fetch missing notes
        const fetchMissingNotes = async () => {
            setIsLoading(true);
            try {
                const fetchedNotes = await fetchNotesByIds(missingNoteIds);

                // Combine notes from state with fetched notes
                const allSourceNotes = [
                    ...relevantNotesFromState,
                    ...fetchedNotes,
                ];

                // Sort by original order in sourceNoteIds
                const sortedNotes = sourceNoteIds
                    .map((id) => allSourceNotes.find((note) => note.id === id))
                    .filter((note): note is Note => note !== undefined);

                setSourceNotes(sortedNotes);
            } catch (error) {
                console.error("Error fetching source notes:", error);
                // Fallback to notes from state only
                setSourceNotes(relevantNotesFromState);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMissingNotes();
    }, [sourceNoteIds, noteIdsInState, relevantNotesFromState]); // Added relevantNotesFromState and extracted noteIdsInState

    // Don't render if no sources
    if (sourceNoteIds.length === 0) {
        return null;
    }

    // Show loading state
    if (isLoading && sourceNotes.length === 0) {
        return (
            <div className={cn("mt-4", className)}>
                <div className="mb-3">
                    <h4 className="text-sm font-semibold text-muted-foreground">
                        Sources ({sourceNoteIds.length})
                    </h4>
                    <div className="text-xs text-muted-foreground mt-1">
                        Loading source notes...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("mt-4", className)}>
            <div className="mb-3">
                <h4 className="text-sm font-semibold text-muted-foreground">
                    Sources ({sourceNotes.length}
                    {isLoading ? `/${sourceNoteIds.length}` : ""})
                </h4>
                <div className="text-xs text-muted-foreground mt-1">
                    {isLoading && sourceNotes.length < sourceNoteIds.length
                        ? `Loading ${
                              sourceNoteIds.length - sourceNotes.length
                          } more source notes...`
                        : "Notes used to generate this answer"}
                </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
                {sourceNotes.map((note) => (
                    <CollapsibleSourceNote
                        key={note.id}
                        note={note}
                        initiallyCollapsed={true}
                    />
                ))}
            </div>
        </div>
    );
}
