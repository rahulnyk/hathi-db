"use client";

import { Note } from "@/store/notesSlice";
import { useAppSelector } from "@/store";
import { LoadingStateDisplay } from "./loading-state-display";
import { NoteErrorBadge } from "./note-error-badge";

export interface NoteStatusIndicatorProps {
    note: Note;
    onRefreshContextSuggestions: () => void;
    onRefreshStructurize: () => void;
}

export function NoteStatusIndicator({
    note,
    onRefreshContextSuggestions,
    onRefreshStructurize,
}: NoteStatusIndicatorProps) {
    const aiSuggestedContexts = useAppSelector(
        (state) => state.ai.suggestedContexts[note.id]
    );
    const aiStructurizeState = useAppSelector(
        (state) => state.ai.structurizedNote[note.id]
    );

    return (
        <div className="flex items-center gap-2">
            {/* Context suggestions loading state - only show when actively loading */}
            {aiSuggestedContexts?.status === "loading" && (
                <LoadingStateDisplay message="Generating context suggestions..." />
            )}

            {/* Context suggestions error state - only show on actual failures */}
            {aiSuggestedContexts?.status === "failed" && (
                <NoteErrorBadge
                    message={
                        aiSuggestedContexts.errorDetails?.userMessage ||
                        `Failed to generate suggestions: ${aiSuggestedContexts.error}`
                    }
                    onRetry={onRefreshContextSuggestions}
                />
            )}

            {/* Note: Empty suggestions are valid - AI determined no contexts are needed.
                Only show error badge on actual API/processing failures */}

            {/* Structurization error state */}
            {aiStructurizeState?.status === "failed" && (
                <NoteErrorBadge
                    message={
                        aiStructurizeState.errorDetails?.userMessage ||
                        `Failed to structurize note: ${aiStructurizeState.error}`
                    }
                    onRetry={onRefreshStructurize}
                />
            )}

            {/* Note Persistence Statuses */}
            {note.persistenceStatus === "deleting" && (
                <LoadingStateDisplay message="Deleting note..." />
            )}
            {note.persistenceStatus === "failed" && (
                <NoteErrorBadge
                    message={note.errorMessage || "Failed to save note"}
                />
            )}
        </div>
    );
}
