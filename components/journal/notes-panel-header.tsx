"use client";

import { cn, slugToSentenceCase, dateToSlug } from "@/lib/utils"; // Added slugToSentenceCase and dateToSlug
import { useAppDispatch, useAppSelector } from "@/store"; // Added useAppDispatch
import { setCurrentContext } from "@/store/notesSlice"; // Added setCurrentContext
import { setChatMode } from "@/store/uiSlice"; // Added setChatMode
import { Target, Home, NotebookPen } from "lucide-react"; // Added NotebookPen icon
import { HathiIcon } from "@/components/icon"; // Import HathiIcon
import { LucideMessageCircleQuestion } from "lucide-react"; // Import MessageCircleQuestionMark icon
export function NotesPanelHeader() {
    const dispatch = useAppDispatch(); // Initialize dispatch
    const { currentContext } = useAppSelector((state) => state.notes);
    const { chatMode } = useAppSelector((state) => state.ui);
    const todaysDateSlug = dateToSlug(new Date());

    const showHomeButton = currentContext !== todaysDateSlug;

    const handleGoToToday = () => {
        dispatch(setCurrentContext(todaysDateSlug));
    };

    const handleToggleChatMode = () => {
        dispatch(setChatMode(!chatMode));
    };

    return (
        <div
            className={cn(
                "w-full sticky top-0 z-10 py-1",
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
                    className={cn(
                        "relative flex items-center p-1 rounded-lg cursor-pointer transition-all duration-300",
                        "bg-zinc-300 dark:bg-zinc-500 border border-zinc-300 dark:border-zinc-700",
                        "w-16 h-4"
                    )}
                    onClick={handleToggleChatMode}
                    title={chatMode ? "Switch to Notes" : "Switch to Assistant"}
                >
                    {/* Background track */}
                    <div
                        className={cn(
                            "absolute inset-1 rounded-md transition-all duration-300 bg-background"
                        )}
                    />

                    {/* Sliding toggle */}
                    <div
                        className={cn(
                            "relative z-10 flex items-center justify-center w-7 h-7 rounded-md transition-all duration-300 shadow-sm",
                            "transform bg-blue-600 text-white",
                            chatMode ? "translate-x-8" : "translate-x-0"
                        )}
                    >
                        {chatMode ? (
                            <LucideMessageCircleQuestion size={16} />
                        ) : (
                            <NotebookPen size={16} />
                        )}
                    </div>

                    {/* Labels */}
                    <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                        <span
                            className={cn(
                                "text-xs font-medium transition-opacity duration-300 text-blue-800",
                                !chatMode ? "opacity-100" : "opacity-40"
                            )}
                        >
                            {/* Notes label - hidden to save space */}
                        </span>
                        <span
                            className={cn(
                                "text-xs font-medium transition-opacity duration-300 text-blue-800",
                                chatMode ? "opacity-100" : "opacity-40"
                            )}
                        >
                            {/* AI label - hidden to save space */}
                        </span>
                    </div>
                </div>
            </div>
            {/* Removed Calendar menu div */}
        </div>
    );
}
