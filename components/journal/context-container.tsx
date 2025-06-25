import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, X, Check } from "lucide-react";
import { useAppDispatch } from "@/store";
import { patchNote, Note } from "@/store/notesSlice";
import { slugToSentenceCase, sentenceCaseToSlug } from "@/lib/utils";

interface contextContainerProps {
    note: Note;
}

export function ContextContainer({ note }: contextContainerProps) {
    const dispatch = useAppDispatch();
    const [contextToBeAdded, setContextToBeAdded] = useState<string | null>(
        null
    );
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customContext, setCustomContext] = useState("");
    const [isAddingCustom, setIsAddingCustom] = useState(false);

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

    const handleCustomContextSubmit = async () => {
        if (!customContext.trim()) return;

        const contextSlug = sentenceCaseToSlug(customContext.trim());

        // Check if context already exists
        if (note.contexts?.includes(contextSlug)) {
            setCustomContext("");
            setShowCustomInput(false);
            return;
        }

        setIsAddingCustom(true);

        try {
            const updatedContexts = [...(note.contexts || []), contextSlug];
            await dispatch(
                patchNote({
                    noteId: note.id,
                    patches: {
                        contexts: updatedContexts,
                    },
                })
            ).unwrap();

            // Clear form and hide input
            setCustomContext("");
            setShowCustomInput(false);
        } catch (error) {
            console.error("Failed to add custom context:", error);
        } finally {
            setIsAddingCustom(false);
        }
    };

    const handleCustomContextCancel = () => {
        setCustomContext("");
        setShowCustomInput(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleCustomContextSubmit();
        } else if (e.key === "Escape") {
            handleCustomContextCancel();
        }
    };

    return (
        <div className="mt-3 flex flex-wrap items-center gap-1">
            {/* Actual contexts */}
            {note.contexts && note.contexts.length > 0 &&
                note.contexts.map((context, index) => (
                    <span key={index} className="context-pill">
                        {slugToSentenceCase(context)}
                    </span>
                ))
            }
            {/* Suggested contexts */}
            {note.suggested_contexts && note.suggested_contexts.length > 0 &&
                note.suggested_contexts
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
                                    <Plus className="h-3 w-3 text-zinc-500 dark:text-zinc-300" />
                                </>
                            )}
                        </Button>
                    ))
            }
            {/* Add custom context button */}
            {!showCustomInput && (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs rounded-lg text-xs"
                    onClick={() => setShowCustomInput(true)}
                >
                    <Plus className="h-3 w-3 text-zinc-500 dark:text-zinc-300" />
                </Button>
            )}
            {/* Custom context input */}
            {showCustomInput && (
                <>
                    <div className="flex items-center gap-1">
                        <Input
                            value={customContext}
                            onChange={(e) => setCustomContext(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Add custom context"
                            className="h-6 w-18 text-xs px-2 py-0 border-zinc-300 dark:border-zinc-600"
                            autoFocus
                            disabled={isAddingCustom}
                        />
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCustomContextSubmit}
                            disabled={!customContext.trim() || isAddingCustom}
                            className="h-6 w-6 p-0"
                        >
                            {isAddingCustom ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Check className="h-3 w-3 text-zinc-500 dark:text-zinc-300" />
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCustomContextCancel}
                            disabled={isAddingCustom}
                            className="h-6 w-6 p-0"
                        >
                            <X className="h-3 w-3 text-zinc-500 dark:text-zinc-300" />
                        </Button>

                    </div>
                </>
            )}
        </div>
    );
}
