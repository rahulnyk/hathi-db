"use client";

import { cn, slugToSentenceCase, dateToSlug } from "@/lib/utils"; // Added slugToSentenceCase and dateToSlug
import { useAppDispatch, useAppSelector } from "@/store"; // Added useAppDispatch
import { setCurrentContext } from "@/store/notesSlice"; // Added setCurrentContext
import { Target, Home } from "lucide-react"; // Added Home icon
import { Button } from "@/components/ui/button"; // Added Button component

export function NotesPanelHeader() {
    const dispatch = useAppDispatch(); // Initialize dispatch
    const { currentContext } = useAppSelector((state) => state.notes);
    const todaysDateSlug = dateToSlug(new Date());

    const showHomeButton = currentContext !== todaysDateSlug;

    const handleGoToToday = () => {
        dispatch(setCurrentContext(todaysDateSlug));
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
                        "flex flex-row items-center gap-2 min-w-0 flex-1 md:justify-start justify-center md:px-5 py-4",
                        "accent-font"
                    )}
                >
                    <Target size={15} className="hidden md:block" />
                    <h2
                        className={cn(
                            "text-2xl",
                            "truncate text-center md:text-left"
                        )}
                    >
                        {slugToSentenceCase(currentContext)}
                    </h2>
                    <Target size={15} className="hidden md:block" />
                </div>

                {/* Home button */}
                {showHomeButton && (
                    <button
                        onClick={handleGoToToday}
                        className="ml-auto accent-font" // Pushes the button to the right
                        title="Go to Today"
                    >
                        <Home size={24} />
                    </button>
                )}
            </div>
            {/* Removed Calendar menu div */}
        </div>
    );
}
