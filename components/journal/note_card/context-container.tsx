import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useAppDispatch } from "@/store";
import { patchNote, Note } from "@/store/notesSlice";
import { slugToSentenceCase } from "@/lib/utils";

interface contextContainerProps {
    note: Note;
}

export function ContextContainer({ note }: contextContainerProps) {
    const dispatch = useAppDispatch();
    const [contextToBeAdded, setContextToBeAdded] = useState<string | null>(
        null
    );

    const handleContextAdd = (context: string) => () => {
        // Set loading state for this context
        setContextToBeAdded(context);
        // Add this context to the note's contexts
        const updatedContexts = [...(note.contexts || []), context];
        dispatch(
            patchNote({
                noteId: note.id,
                patches: {
                    contexts: updatedContexts,
                },
            })
        ).finally(() => {
            // Clear loading state when request completes
            setContextToBeAdded(null);
        });
    };
    return (
        <div className="flex flex-row items-center gap-2">
            {/* Actual contexts */}
            {note.contexts && note.contexts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                    {note.contexts.map((context, index) => (
                        <span key={index} className="context-pill">
                            {slugToSentenceCase(context)}
                        </span>
                    ))}
                </div>
            )}
            {/* Suggested contexts */}
            {note.suggested_contexts && note.suggested_contexts.length > 0 && (
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                        {note.suggested_contexts
                            .filter(
                                (context) => !note.contexts?.includes(context)
                            )
                            .map((context, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    className="suggested-context-pill h-6 px-2 text-xs rounded-lg"
                                    onClick={handleContextAdd(context)}
                                    disabled={contextToBeAdded === context}
                                >
                                    {contextToBeAdded === context ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <>
                                            {slugToSentenceCase(context)}
                                            <Plus className="h-3 w-3" />
                                        </>
                                    )}
                                </Button>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
