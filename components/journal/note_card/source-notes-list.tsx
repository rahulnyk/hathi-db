"use client";

import React from "react";
import { useAppSelector } from "@/store";
import { getAIAnswerDetails } from "@/store/aiSlice";
import { CollapsibleSourceNote } from "./collapsible-source-note";
import { cn } from "@/lib/utils";

interface SourceNotesListProps {
    aiNoteId: string;
    className?: string;
}

export function SourceNotesList({ aiNoteId, className }: SourceNotesListProps) {
    // Get AI answer details to access source note IDs
    const aiAnswerDetails = useAppSelector((state) => 
        getAIAnswerDetails(state, aiNoteId)
    );

    // Get all notes from the store to look up source notes
    const allNotes = useAppSelector((state) => state.notes.notes);

    // Get source note IDs
    const sourceNoteIds = aiAnswerDetails?.relevantSources || [];

    // Find actual note objects for source IDs
    const sourceNotes = React.useMemo(() => {
        return sourceNoteIds
            .map(id => allNotes.find(note => note.id === id))
            .filter((note): note is NonNullable<typeof note> => note !== undefined);
    }, [sourceNoteIds, allNotes]);

    // Don't render if no sources
    if (sourceNotes.length === 0) {
        return null;
    }

    return (
        <div className={cn("mt-4", className)}>
            <div className="mb-3">
                <h4 className="text-sm font-semibold text-muted-foreground">
                    Sources ({sourceNotes.length})
                </h4>
                <div className="text-xs text-muted-foreground mt-1">
                    Notes used to generate this answer
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
