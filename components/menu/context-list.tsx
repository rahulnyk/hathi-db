"use client";

import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchContextsPaginated } from "@/store/notesMetadataSlice";
// import { setCurrentContext } from "@/store/notesSlice";
import { DeviceType } from "@/store/uiSlice";
import { ContextStatParams } from "@/app/actions/contexts";
import { cn, slugToSentenceCase } from "@/lib/utils";
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
    if (status === "loading" && contexts.length === 0) {
        return (
            <div className="px-4 py-2 text-sm text-neutral-500">
                Loading contexts...
            </div>
        );
    }

    // Only show error state if we have no contexts and the request failed
    if (status === "failed" && contexts.length === 0) {
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
            {contexts.map((contextStat: ContextStatParams) => (
                <div
                    key={contextStat.context}
                    onClick={() => handleContextClick(contextStat.context)}
                    className={cn(
                        "flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition-colors duration-150",
                        currentContext === contextStat.context
                            ? "bg-blue-700/10 dark:bg-blue-400/10"
                            : "hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                    )}
                >
                    <span
                        className={cn(
                            "text-sm font-medium truncate",
                            currentContext === contextStat.context
                                ? "text-blue-900 dark:text-blue-200"
                                : "text-neutral-700 dark:text-neutral-200"
                        )}
                        title={contextStat.context}
                    >
                        {slugToSentenceCase(contextStat.context)}
                    </span>
                    <span
                        className={cn(
                            "ml-2 text-xs font-semibold rounded-full px-2 py-0.5",
                            currentContext === contextStat.context
                                ? "text-blue-900 bg-blue-500/20 dark:bg-blue-500/20 dark:text-blue-200"
                                : "text-neutral-500 bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300"
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
