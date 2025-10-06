"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchContextsPaginated } from "@/store/notesMetadataSlice";
// import { setCurrentContext } from "@/store/notesSlice";
import { DeviceType, clearDatePickerSelection } from "@/store/uiSlice";
import { ContextStats } from "@/db/types";
import { cn, slugToSentenceCase, isValidDateSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useContextNavigation } from "@/lib/context-navigation";

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
                    onClick={() => handleContextClick(contextStat.context)}
                    className={cn(
                        "flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition-all duration-200",
                        currentContext === contextStat.context
                            ? "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                            : "hover:bg-gray-300/70 dark:hover:bg-gray-700"
                    )}
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
                    <span
                        className={cn(
                            "ml-2 rounded-full px-2 py-0.5 text-xs",
                            currentContext === contextStat.context
                                ? "button-font-secondary bg-gray-400/50 dark:bg-gray-500/50"
                                : "button-font-secondary bg-gray-200 dark:bg-gray-600"
                        )}
                    >
                        {contextStat.count}
                    </span>
                </div>
            ))}

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
