"use client";

import React, { useEffect, useState } from "react";
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

    // Get source note IDs
    const sourceNoteIds = aiAnswerDetails?.relevantSources || [];

    // Effect to fetch missing source notes
    useEffect(() => {
        if (sourceNoteIds.length === 0) {
            setSourceNotes([]);
            return;
        }

        // Find notes that are already in Redux state
        const notesFromState = sourceNoteIds
            .map(id => notesInState.find(note => note.id === id))
            .filter((note): note is Note => note !== undefined);

        // Find missing note IDs
        const missingNoteIds = sourceNoteIds.filter(
            id => !notesInState.find(note => note.id === id)
        );

        if (missingNoteIds.length === 0) {
            // All notes are already in state
            setSourceNotes(notesFromState);
            return;
        }

        // Set notes from state immediately, then fetch missing ones
        setSourceNotes(notesFromState);

        // Fetch missing notes
        const fetchMissingNotes = async () => {
            setIsLoading(true);
            try {
                const fetchedNotes = await fetchNotesByIds(missingNoteIds);
                
                // Combine notes from state with fetched notes
                const allSourceNotes = [
                    ...notesFromState,
                    ...fetchedNotes
                ];
                
                // Sort by original order in sourceNoteIds
                const sortedNotes = sourceNoteIds
                    .map(id => allSourceNotes.find(note => note.id === id))
                    .filter((note): note is Note => note !== undefined);
                
                setSourceNotes(sortedNotes);
            } catch (error) {
                console.error('Error fetching source notes:', error);
                // Fallback to notes from state only
                setSourceNotes(notesFromState);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMissingNotes();
    }, [sourceNoteIds, notesInState]);

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
                    Sources ({sourceNotes.length}{isLoading ? `/${sourceNoteIds.length}` : ''})
                </h4>
                <div className="text-xs text-muted-foreground mt-1">
                    {isLoading && sourceNotes.length < sourceNoteIds.length 
                        ? `Loading ${sourceNoteIds.length - sourceNotes.length} more source notes...`
                        : 'Notes used to generate this answer'
                    }
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
