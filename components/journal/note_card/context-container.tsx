import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, X, Check } from "lucide-react";
import { slugToSentenceCase, sentenceCaseToSlug } from "@/lib/utils";
import { useAppDispatch } from "@/store";
import { updateNoteOptimistically, Note } from "@/store/notesSlice";

interface ContextContainerProps {
    contexts: string[];
    suggestedContexts?: string[];
    onContextsChange?: (newContexts: string[]) => void;
    className?: string;
    readOnly?: boolean;
    note?: Note; // Add note prop for independent context updates
    enableIndependentUpdates?: boolean; // Flag to enable independent context updates
}

export function ContextContainer({
    contexts,
    suggestedContexts = [],
    onContextsChange,
    className,
    readOnly = false,
    note,
    enableIndependentUpdates = false,
}: ContextContainerProps) {
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customContext, setCustomContext] = useState("");
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const dispatch = useAppDispatch();

    const handleAddContext = (context: string) => {
        const newContexts = [...contexts, context];

        // If we have independent updates enabled and a note, patch directly to store
        if (enableIndependentUpdates && note) {
            dispatch(
                updateNoteOptimistically({
                    noteId: note.id,
                    patches: { contexts: newContexts },
                })
            );
        }

        // Also call the callback for local state management (for edit mode)
        if (onContextsChange) {
            onContextsChange(newContexts);
        }
    };

    const handleRemoveContext = (contextToRemove: string) => {
        const newContexts = contexts.filter(
            (context) => context !== contextToRemove
        );

        // If we have independent updates enabled and a note, patch directly to store
        if (enableIndependentUpdates && note) {
            dispatch(
                updateNoteOptimistically({
                    noteId: note.id,
                    patches: { contexts: newContexts },
                })
            );
        }

        // Also call the callback for local state management (for edit mode)
        if (onContextsChange) {
            onContextsChange(newContexts);
        }
    };

    const handleCustomContextSubmit = async () => {
        if (!customContext.trim()) return;

        const contextSlug = sentenceCaseToSlug(customContext.trim());

        if (contexts.includes(contextSlug)) {
            setCustomContext("");
            setShowCustomInput(false);
            return;
        }

        setIsAddingCustom(true);
        const newContexts = [...contexts, contextSlug];

        // If we have independent updates enabled and a note, patch directly to store
        if (enableIndependentUpdates && note) {
            dispatch(
                updateNoteOptimistically({
                    noteId: note.id,
                    patches: { contexts: newContexts },
                })
            );
        }

        // Also call the callback for local state management (for edit mode)
        if (onContextsChange) {
            onContextsChange(newContexts);
        }

        setCustomContext("");
        setShowCustomInput(false);
        setIsAddingCustom(false);
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
        <div
            className={`flex flex-wrap items-center gap-1 pb-2 ${
                className || ""
            }`}
        >
            {/* Existing contexts */}
            {contexts.map((context, index) => (
                <span key={index} className="context-pill group relative">
                    {slugToSentenceCase(context)}
                    {!readOnly && onContextsChange && (
                        <button
                            onClick={() => handleRemoveContext(context)}
                            className="absolute -top-1 -right-1 bg-zinc-200 dark:bg-zinc-700 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-2 w-2 text-zinc-600 dark:text-zinc-300" />
                        </button>
                    )}
                </span>
            ))}

            {!readOnly && (
                <>
                    {/* Suggested contexts */}
                    {suggestedContexts
                        .filter((context) => !contexts.includes(context))
                        .map((context, index) => (
                            <Button
                                key={index}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="suggested-context-pill h-6 px-2 text-xs rounded-lg"
                                onClick={() => handleAddContext(context)}
                            >
                                {slugToSentenceCase(context)}
                                <Plus className="h-3 w-3 ml-1 text-zinc-500 dark:text-zinc-300" />
                            </Button>
                        ))}

                    {/* Add custom context button */}
                    {!showCustomInput && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs rounded-lg"
                            onClick={() => setShowCustomInput(true)}
                        >
                            <Plus className="h-3 w-3 text-zinc-500 dark:text-zinc-300" />
                        </Button>
                    )}

                    {/* Custom context input */}
                    {showCustomInput && (
                        <div className="flex items-center gap-1">
                            <Input
                                value={customContext}
                                onChange={(e) =>
                                    setCustomContext(e.target.value)
                                }
                                onKeyDown={handleKeyDown}
                                placeholder="Add context"
                                className="h-6 w-24 text-xs px-2 py-0 border-zinc-300 dark:border-zinc-600"
                                autoFocus
                                disabled={isAddingCustom}
                            />
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={handleCustomContextSubmit}
                                disabled={
                                    !customContext.trim() || isAddingCustom
                                }
                                className="h-6 w-6 p-0"
                            >
                                {isAddingCustom ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Check className="h-3 w-3 text-zinc-500 dark:text-zinc-300" />
                                )}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={handleCustomContextCancel}
                                disabled={isAddingCustom}
                                className="h-6 w-6 p-0"
                            >
                                <X className="h-3 w-3 text-zinc-500 dark:text-zinc-300" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
