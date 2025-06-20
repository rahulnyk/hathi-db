"use client";

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchContextsMetadata } from "@/store/notesMetadataSlice";
import { setCurrentContext } from "@/store/notesSlice";
import { DeviceType } from "@/store/uiSlice"; // Import DeviceType
import { ContextStat } from "@/app/actions/notes";
import { cn } from "@/lib/utils";

interface ContextListProps {
    onCloseMenu: () => void;
    deviceType: DeviceType;
}

export function ContextList({ onCloseMenu, deviceType }: ContextListProps) {
    const dispatch = useAppDispatch();
    const { contexts, status } = useAppSelector((state) => state.notesMetadata);
    const { currentContext } = useAppSelector((state) => state.notes);

    useEffect(() => {
        if (status === "idle") {
            dispatch(fetchContextsMetadata());
        }
    }, [status, dispatch]);

    const sortedContexts = useMemo(() => {
        return [...contexts].sort(
            (a, b) =>
                new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
        );
    }, [contexts]);

    const handleContextClick = (contextSlug: string) => {
        if (deviceType === DeviceType.Mobile) { // Conditionally call onCloseMenu
            onCloseMenu();
        }
        dispatch(setCurrentContext(contextSlug));
    };

    if (status === "loading" || status === "idle") {
        return (
            <div className="px-4 py-2 text-sm text-neutral-500">
                Loading contexts...
            </div>
        );
    }

    if (status === "failed") {
        return (
            <div className="px-4 py-2 text-sm text-red-500">
                Failed to load contexts.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1 px-2 py-1">
            {sortedContexts.map((contextStat: ContextStat) => (
                <div
                    key={contextStat.context}
                    onClick={() => handleContextClick(contextStat.context)}
                    className={cn(
                        "flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition-colors duration-150",
                        currentContext === contextStat.context
                            ? "bg-cyan-100/50 dark:bg-cyan-900/50"
                            : "hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                    )}
                >
                    <span
                        className={cn(
                            "text-sm font-medium truncate",
                            currentContext === contextStat.context
                                ? "text-cyan-900 dark:text-cyan-200"
                                : "text-neutral-700 dark:text-neutral-200"
                        )}
                        title={contextStat.context}
                    >
                        {contextStat.context}
                    </span>
                    <span
                        className={cn(
                            "ml-2 text-xs font-semibold rounded-full px-2 py-0.5",
                            currentContext === contextStat.context
                                ? "text-cyan-700 bg-cyan-300/50 dark:bg-cyan-800/70 dark:text-cyan-200"
                                : "text-neutral-500 bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300"
                        )}
                    >
                        {contextStat.count}
                    </span>
                </div>
            ))}
        </div>
    );
}
