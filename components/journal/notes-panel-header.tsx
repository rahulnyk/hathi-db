"use client";

import { cn, slugToSentenceCase, dateToSlug } from "@/lib/utils"; // Added slugToSentenceCase and dateToSlug
import { useAppDispatch, useAppSelector } from "@/store"; // Added useAppDispatch
import { setChatMode } from "@/store/uiSlice"; // Added setChatMode
import { Target, Home, NotebookPen, Loader2 } from "lucide-react"; // Added NotebookPen and Loader2 icons
import { LucideMessageCircleQuestion } from "lucide-react"; // Import MessageCircleQuestionMark icon
import { useRouter } from "next/navigation";
export function NotesPanelHeader() {
    const dispatch = useAppDispatch(); // Initialize dispatch
    const router = useRouter();
    const { currentContext } = useAppSelector((state) => state.notes);
    const { chatMode, isNavigatingToContext } = useAppSelector(
        (state) => state.ui
    );
    const todaysDateSlug = dateToSlug(new Date());

    const showHomeButton = currentContext !== todaysDateSlug;

    const handleGoToToday = () => {
        // Navigate to today's date instead of just updating Redux
        router.push(`/journal/${todaysDateSlug}`);
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
                <button
                    className={cn(
                        "relative flex items-center cursor-pointer transition-all duration-300",
                        "border border-zinc-300 dark:border-zinc-700",
                        "w-16 h-7 p-0.5 bg-zinc-200 dark:bg-zinc-800",
                        "rounded-md" // Changed from rounded-full to rounded-md for square-rounded look
                    )}
                    onClick={handleToggleChatMode}
                    title={chatMode ? "Switch to Notes" : "Switch to Assistant"}
                    type="button"
                >
                    {/* Sliding toggle */}
                    <div
                        className={cn(
                            "absolute left-0.5 flex items-center justify-center transition-transform duration-500",
                            "w-6 h-6 shadow-sm",
                            "bg-blue-600 text-white",
                            "rounded-sm", // Changed from rounded-full to rounded-sm
                            chatMode
                                ? "transform translate-x-8" // Translate to the right in chat mode
                                : "transform translate-x-0" // Stay at original position in notes mode
                        )}
                    >
                        {isNavigatingToContext ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : chatMode ? (
                            <LucideMessageCircleQuestion size={16} />
                        ) : (
                            <NotebookPen size={16} />
                        )}
                    </div>

                    {/* Indicator icons (optional) */}
                    <span
                        className={cn(
                            "absolute left-1 transition-opacity duration-300",
                            chatMode ? "opacity-0" : "opacity-0"
                        )}
                    >
                        <NotebookPen size={14} className="text-zinc-400" />
                    </span>
                    <span
                        className={cn(
                            "absolute right-1 transition-opacity duration-300",
                            chatMode ? "opacity-0" : "opacity-0"
                        )}
                    >
                        <LucideMessageCircleQuestion
                            size={14}
                            className="text-zinc-400"
                        />
                    </span>
                </button>
            </div>
            {/* Removed Calendar menu div */}
        </div>
    );
}
