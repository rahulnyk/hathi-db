"use client";

import { cn, slugToSentenceCase, dateToSlug } from "@/lib/utils"; // Added slugToSentenceCase and dateToSlug
import { useAppDispatch, useAppSelector } from "@/store"; // Added useAppDispatch
import { setChatMode } from "@/store/uiSlice"; // Added setChatMode
import { Target, Home, NotebookPen, Loader2 } from "lucide-react"; // Added NotebookPen and Loader2 icons
import { LucideMessageCircleQuestion } from "lucide-react"; // Import MessageCircleQuestionMark icon
import { useContextNavigation } from "@/lib/context-navigation";
export function NotesPanelHeader() {
    const dispatch = useAppDispatch(); // Initialize dispatch
    const { navigateToContext } = useContextNavigation();
    const { currentContext } = useAppSelector((state) => state.notes);
    const { chatMode, isNavigatingToContext } = useAppSelector(
        (state) => state.ui
    );
    const todaysDateSlug = dateToSlug(new Date());

    const showHomeButton = currentContext !== todaysDateSlug;

    const handleGoToToday = () => {
        // Use context navigation hook to properly exit chat mode and navigate to today
        navigateToContext(todaysDateSlug);
    };

    const handleToggleChatMode = () => {
        dispatch(setChatMode(!chatMode));
    };

    return (
        <div
            className={cn(
                "w-full sticky top-0 z-10 py-2",
                "bg-background",
                "h-14 rounded-b-xl" // Set height
            )}
        >
            <div
                className={cn(
                    "flex flex-row justify-start items-center gap-4 h-full", // Ensure content uses full height
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
                        {chatMode
                            ? "Ask Hathi"
                            : slugToSentenceCase(currentContext)}
                    </h2>
                </div>

                {/* Home button */}
                {showHomeButton && !chatMode && (
                    <button
                        onClick={handleGoToToday}
                        className="accent-font"
                        title="Go to Today"
                    >
                        <Home size={24} />
                    </button>
                )}

                {/* Toggle switch between Notes and Assistant */}
                <div
                    className="relative inline-flex bg-gray-200 dark:bg-gray-700 rounded-full p-1 border border-gray-300 dark:border-gray-600 cursor-pointer"
                    onClick={handleToggleChatMode}
                >
                    {/* Sliding background indicator */}
                    <div
                        className={cn(
                            "absolute top-1 w-16 h-6 rounded-full shadow-md transition-all duration-300 ease-in-out",
                            "bg-blue-700 dark:bg-blue-600",
                            chatMode ? "translate-x-16" : "translate-x-0"
                        )}
                    />

                    {/* Note Option */}
                    <div
                        className={cn(
                            "relative z-10 flex items-center justify-center gap-1 w-16 h-6 rounded-full transition-colors duration-300 text-xs font-medium",
                            chatMode
                                ? "text-gray-600 dark:text-gray-400"
                                : "text-white"
                        )}
                    >
                        {isNavigatingToContext && !chatMode ? (
                            <Loader2 size={10} className="animate-spin" />
                        ) : (
                            <NotebookPen size={10} />
                        )}
                        <span>NOTE</span>
                    </div>

                    {/* Ask Option */}
                    <div
                        className={cn(
                            "relative z-10 flex items-center justify-center gap-1 w-16 h-6 rounded-full transition-colors duration-300 text-xs font-medium",
                            chatMode
                                ? "text-white"
                                : "text-gray-600 dark:text-gray-400"
                        )}
                    >
                        {isNavigatingToContext && chatMode ? (
                            <Loader2 size={10} className="animate-spin" />
                        ) : (
                            <LucideMessageCircleQuestion size={10} />
                        )}
                        <span>ASK</span>
                    </div>
                </div>
            </div>
            {/* Removed Calendar menu div */}
        </div>
    );
}
