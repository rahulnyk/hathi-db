"use client";

import { Note } from "@/store/notesSlice";
import { useAppSelector } from "@/store";
import { LoadingStateDisplay } from "./loading-state-display";
import { ErrorStateDisplay } from "./error-state-display";

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
        <>
            {/* Context suggestions loading/error states */}
            {aiSuggestedContexts && !note.suggested_contexts?.length && (
                <>
                    {aiSuggestedContexts.status === "loading" && (
                        <LoadingStateDisplay message="Generating context suggestions..." />
                    )}
                    {aiSuggestedContexts.status === "failed" && (
                        <ErrorStateDisplay
                            message={`Failed to generate suggestions: ${aiSuggestedContexts.error}`}
                            onRetry={onRefreshContextSuggestions}
                        />
                    )}
                </>
            )}

            {/* Initial loading for new notes */}
            {!aiSuggestedContexts &&
                !note.suggested_contexts?.length &&
                note.persistenceStatus === "persisted" && (
                    <LoadingStateDisplay message="Generating context suggestions..." />
                )}

            {/* Structurization error state */}
            {aiStructurizeState?.status === "failed" && (
                <ErrorStateDisplay
                    message={`Failed to structurize note: ${aiStructurizeState.error}`}
                    onRetry={onRefreshStructurize}
                />
            )}

            {/* Note Persistence Statuses */}
            {note.persistenceStatus === "deleting" && (
                <LoadingStateDisplay message="Deleting note..." />
            )}
            {note.persistenceStatus === "failed" && (
                <ErrorStateDisplay
                    message={note.errorMessage || "Failed to save note"}
                />
            )}
        </>
    );
}
