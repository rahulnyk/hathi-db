import React, { useEffect } from "react";
import { useAppDispatch } from "@/store";
import { addSearchResultNotes } from "@/store/notesSlice";
import { SearchToolResponse } from "@/app/agent_tools/types";
import { SearchResultNote } from "@/db/postgres/adapter";
import { NoteCard } from "@/components/journal/note_card/notes-card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotebookText } from "lucide-react";
import { TodoNoteCard } from "@/components/journal/note_card/todo-note-card";
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

        // Note: We no longer automatically cleanup search results on unmount
        // This allows them to persist when navigating to contexts from chat
        // They will be cleaned up when chat is explicitly cleared or reset
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
                    className="w-full justify-between p-2 sm:p-3 text-left font-normal h-auto"
                >
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <NotebookText className="inline-block h-4 w-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium truncate">
                            Found {result.notes.length} note
                            {result.notes.length === 1 ? "" : "s"}
                        </span>
                        <span className="text-xs text-muted-foreground hidden sm:block">
                            ({result.message})
                        </span>
                    </div>
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    ) : (
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    )}
                </Button>

                {/* Collapsible Content */}
                {!collapsed && (
                    <div className="border-t p-2 sm:p-3">
                        <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                            {result.notes.map((note: SearchResultNote) => (
                                <div key={note.id} className="relative">
                                    {note.note_type === "todo" ? (
                                        <TodoNoteCard
                                            note={note}
                                            disableCardHeader
                                        />
                                    ) : (
                                        <NoteCard
                                            note={note}
                                            disableCardHeader
                                        />
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
