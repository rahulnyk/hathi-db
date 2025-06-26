"use client";

import { cn, slugToSentenceCase } from "@/lib/utils"; // Added slugToSentenceCase
import { useAppSelector } from "@/store";
import { Target } from "lucide-react";
export function NotesPanelHeader() {
    const { currentContext } = useAppSelector((state) => state.notes);

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

                {/* Removed Right side - Action buttons div */}
            </div>
            {/* Removed Calendar menu div */}
        </div>
    );
}
