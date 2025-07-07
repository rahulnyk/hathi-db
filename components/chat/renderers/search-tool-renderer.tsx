import React, { useEffect } from "react";
import { useAppDispatch } from "@/store";
import {
    addSearchResultNotes,
    clearSearchResultNotes,
} from "@/store/notesSlice";
import { SearchToolResponse, SearchResultNote } from "@/app/agent_tools/types";
import { NoteCard } from "@/components/journal/note_card/notes-card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotebookText } from "lucide-react";
// Search Results Component
export function SearchResultsRenderer({
    result,
    toolInfoHeader,
}: {
    result: SearchToolResponse;
    toolInfoHeader: React.ReactNode;
}) {
    const dispatch = useAppDispatch();
    const [collapsed, setCollapsed] = React.useState(true); // Default to collapsed

    // Add search results to the store as search result notes so they can be edited
    useEffect(() => {
        const tempNotes = result.notes.map((note: SearchResultNote) => ({
            ...note,
            persistenceStatus: "persisted" as const,
        }));
        dispatch(addSearchResultNotes(tempNotes));

        // Cleanup function to remove these specific search result notes when component unmounts
        return () => {
            const noteIds = tempNotes.map((note) => note.id);
            dispatch(clearSearchResultNotes(noteIds));
        };
    }, [result.notes, dispatch]);

    if (!result.success) {
        return (
            <div>
                {toolInfoHeader}
                <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
                    {result.message || "Failed to search notes"}
                </div>
            </div>
        );
    }

    if (!result.notes || result.notes.length === 0) {
        return (
            <div>
                {toolInfoHeader}
                <div className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded">
                    🗒️ No notes found matching your criteria
                </div>
            </div>
        );
    }

    return (
        <div>
            {toolInfoHeader}
            <div className="border rounded-lg bg-card">
                {/* Collapsible Header */}
                <Button
                    variant="ghost"
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full justify-between p-3 text-left font-normal h-auto"
                >
                    <div className="flex items-center gap-2">
                        <NotebookText className="inline-block" />
                        <span className="text-sm font-medium">
                            Found {result.notes.length} note
                            {result.notes.length === 1 ? "" : "s"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            ({result.message})
                        </span>
                    </div>
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>

                {/* Collapsible Content */}
                {!collapsed && (
                    <div className="border-t p-3">
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {result.notes.map((note: SearchResultNote) => (
                                <div key={note.id} className="relative">
                                    <NoteCard note={note} />
                                    {note.similarity && (
                                        <div className="absolute top-2 right-2 text-xs bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                                            {(note.similarity * 100).toFixed(0)}
                                            % match
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
