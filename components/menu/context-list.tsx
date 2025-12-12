"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchContextsPaginated } from "@/store/notesMetadataSlice";
// import { setCurrentContext } from "@/store/notesSlice";
import { DeviceType, clearDatePickerSelection } from "@/store/uiSlice";
import { ContextStats } from "@/db/types";
import { cn, slugToSentenceCase, isValidDateSlug, sentenceCaseToSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Check, X } from "lucide-react";
import { useContextNavigation } from "@/lib/context-navigation";
import { renameContext, checkContextExists } from "@/app/actions/contexts";
import { setCurrentContext } from "@/store/notesSlice";

interface ContextListProps {
    onCloseMenu: () => void;
    deviceType: DeviceType;
}

export function ContextList({ onCloseMenu, deviceType }: ContextListProps) {
    const dispatch = useAppDispatch();
    const { navigateToContext } = useContextNavigation();
    const { contexts, status, hasMore, isLoadingMore } = useAppSelector(
        (state) => state.notesMetadata
    );
    const { currentContext } = useAppSelector((state) => state.notes);

    // State for edit mode
    const [editingContext, setEditingContext] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameError, setRenameError] = useState<string | null>(null);

    // Filter out date contexts (contexts that match the date slug pattern)
    const filteredContexts = useMemo(() => {
        return contexts.filter(
            (contextStat) => !isValidDateSlug(contextStat.context)
        );
    }, [contexts]);

    // Check if we're refreshing (have contexts but status is loading)
    const isRefreshing = status === "loading" && contexts.length > 0;

    // Fetch contexts when component mounts
    useEffect(() => {
        if (status === "idle") {
            dispatch(fetchContextsPaginated({ reset: true }));
        }
    }, [status, dispatch]);

    const handleContextClick = (contextSlug: string) => {
        if (deviceType === "mobile") {
            onCloseMenu();
        }
        // Clear the date picker selection when selecting a non-date context
        // This ensures mutual exclusivity between date and context selection
        dispatch(clearDatePickerSelection());

        // Use the context navigation hook to properly exit chat mode and preserve chat history
        navigateToContext(contextSlug);
    };

    const handleLoadMore = useCallback(() => {
        if (hasMore && !isLoadingMore) {
            dispatch(fetchContextsPaginated());
        }
    }, [hasMore, isLoadingMore, dispatch]);

    const handleEditClick = (contextSlug: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingContext(contextSlug);
        setEditValue(slugToSentenceCase(contextSlug));
        setRenameError(null);
    };

    const handleCancelEdit = () => {
        setEditingContext(null);
        setEditValue("");
        setRenameError(null);
    };

    const handleSaveEdit = async (oldContextSlug: string) => {
        const newName = editValue.trim();
        if (!newName) {
            setRenameError("Context name cannot be empty");
            return;
        }

        const newSlug = sentenceCaseToSlug(newName);
        if (newSlug === oldContextSlug) {
            setEditingContext(null);
            setEditValue("");
            return;
        }

        setIsRenaming(true);
        setRenameError(null);

        try {
            // Check if context exists
            const exists = await checkContextExists(newSlug);
            
            if (exists) {
                const confirmed = window.confirm(
                    `Context "${slugToSentenceCase(newSlug)}" already exists.\n\nDo you want to merge "${slugToSentenceCase(oldContextSlug)}" into it?\n\nThis will move all notes to the new context and delete "${slugToSentenceCase(oldContextSlug)}".`
                );
                
                if (!confirmed) {
                    setIsRenaming(false);
                    return;
                }
            }

            await renameContext(oldContextSlug, newSlug);

            // Update current context if it was the one being renamed
            if (currentContext === oldContextSlug) {
                dispatch(setCurrentContext(newSlug));
            }

            // Refresh the context list
            dispatch(fetchContextsPaginated({ reset: true }));

            setEditingContext(null);
            setEditValue("");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to rename context";
            setRenameError(errorMessage);
        } finally {
            setIsRenaming(false);
        }
    };

    // Only show loading when we have no contexts AND we're in a loading state on initial load
    // This prevents flickering when contexts are being refreshed
    if (status === "loading" && filteredContexts.length === 0) {
        return (
            <div className="px-4 py-2 text-sm text-neutral-500">
                Loading contexts...
            </div>
        );
    }

    // Only show error state if we have no contexts and the request failed
    if (status === "failed" && filteredContexts.length === 0) {
        return (
            <div className="px-4 py-2 text-sm text-red-500">
                Failed to load contexts.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1 px-2 py-1">
            {/* Optional subtle refresh indicator */}
            {isRefreshing && (
                <div className="px-2 py-1 text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating...
                </div>
            )}

            {/* Context List */}
            {filteredContexts.map((contextStat: ContextStats) => (
                <div
                    key={contextStat.context}
                    className={cn(
                        "group flex items-center justify-between px-2 py-1 rounded-md transition-all duration-200",
                        editingContext === contextStat.context
                            ? "bg-gray-300 dark:bg-gray-600"
                            : currentContext === contextStat.context
                                ? "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 cursor-pointer"
                                : "hover:bg-gray-300/70 dark:hover:bg-gray-700 cursor-pointer"
                    )}
                >
                    {editingContext === contextStat.context ? (
                        <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm rounded border border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleSaveEdit(contextStat.context);
                                    } else if (e.key === "Escape") {
                                        e.preventDefault();
                                        handleCancelEdit();
                                    }
                                }}
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveEdit(contextStat.context);
                                }}
                                disabled={isRenaming}
                                className="p-1 hover:bg-gray-400 dark:hover:bg-gray-500 rounded"
                                title="Save"
                            >
                                {isRenaming ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                )}
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                disabled={isRenaming}
                                className="p-1 hover:bg-gray-400 dark:hover:bg-gray-500 rounded"
                                title="Cancel"
                            >
                                <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div
                                className="flex-1 flex items-center justify-between"
                                onClick={() => handleContextClick(contextStat.context)}
                            >
                                <span
                                    className={cn(
                                        "truncate",
                                        currentContext === contextStat.context
                                            ? "menu-font-active"
                                            : "menu-font"
                                    )}
                                    title={contextStat.context}
                                >
                                    {slugToSentenceCase(contextStat.context)}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleEditClick(contextStat.context, e)}
                                        className="p-1 hover:bg-gray-400 dark:hover:bg-gray-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Edit context name"
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </button>
                                    <span
                                        className={cn(
                                            "rounded-full px-2 py-0.5 text-xs",
                                            currentContext === contextStat.context
                                                ? "button-font-secondary bg-gray-400/50 dark:bg-gray-500/50"
                                                : "button-font-secondary bg-gray-200 dark:bg-gray-600"
                                        )}
                                    >
                                        {contextStat.count}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ))}

            {/* Error message */}
            {renameError && (
                <div className="px-2 py-1 text-xs text-red-500">
                    {renameError}
                </div>
            )}

            {/* Load More Button */}
            {hasMore && (
                <div className="px-2 mt-2">
                    <Button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                Loading...
                            </>
                        ) : (
                            "More"
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
