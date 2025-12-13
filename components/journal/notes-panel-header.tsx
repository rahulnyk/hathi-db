"use client";

import { cn, slugToSentenceCase } from "@/lib/utils";
import { useAppSelector } from "@/store";
import { Target, Calendar } from "lucide-react";
import { useContextNavigation } from "@/lib/context-navigation";

export function NotesPanelHeader() {
    const { navigateToContext } = useContextNavigation();
    const { currentContext } = useAppSelector((state) => state.notes);
    const { todayContext } = useAppSelector((state) => state.ui);
    const todaysDateSlug = todayContext;

    const showHomeButton = currentContext !== todaysDateSlug;

    const handleGoToToday = () => {
        // Use context navigation hook to properly navigate to today
        navigateToContext(todaysDateSlug);
    };

    return (
        <div
            className={cn(
                "w-full sticky top-0 z-10 py-2",
                "bg-background",
                "h-14", // Set height
                "border-b border-border"
            )}
        >
            <div
                className={cn(
                    "flex flex-row justify-between items-center gap-4 h-full",
                    "px-4 py-2 group"
                )}
            >
                {/* Context title */}
                <div
                    className={cn(
                        "flex flex-row items-center gap-4 min-w-0 flex-1 md:justify-start justify-center md:px-5 py-4",
                        "accent-font"
                    )}
                >
                    <Target size={22} className="hidden md:block" />
                    <h2
                        className={cn(
                            "text-2xl",
                            "truncate text-center md:text-left"
                        )}
                    >
                        {slugToSentenceCase(currentContext)}
                    </h2>
                </div>

                {/* Today button */}
                <button
                    onClick={showHomeButton ? handleGoToToday : undefined}
                    disabled={!showHomeButton}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 border",
                        showHomeButton
                            ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 button-font-secondary cursor-pointer"
                            : "bg-teal-50/50 dark:bg-teal-900/20 text-teal-600/70 dark:text-teal-400/70 border-teal-100/50 dark:border-teal-800/30 cursor-default"
                    )}
                    title={showHomeButton ? "Go to Today's Journal" : "Today"}
                >
                    <Calendar size={14} />
                    <span
                        className={cn(
                            "hidden sm:inline",
                            !showHomeButton &&
                                "uppercase text-[10px] tracking-wider font-medium"
                        )}
                    >
                        Today
                    </span>
                </button>
            </div>
        </div>
    );
}
