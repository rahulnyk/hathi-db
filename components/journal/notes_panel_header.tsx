"use client";

import { cn, slugToSentenceCase } from "@/lib/utils"; // Added slugToSentenceCase
import { useAppSelector } from "@/store";
import { Target } from "lucide-react"; // Importing Target icon
export function NotesPanelHeader() {
    const { currentContext } = useAppSelector((state) => state.notes);

    return (
        <div
            className={cn(
                "w-full sticky top-0 z-10 py-1",
                "bg-background",
                "h-10 rounded-b-xl", // Set height
                // "bg-background/50 dark:bg-background/50", // Background color for frost effect
                "backdrop-blur-2xl" // Frost effect
                // "border border-zinc-300 dark:border-zinc-600 border-t-0"
            )}
        >
            <div
                className={cn(
                    "flex flex-row justify-start items-center gap-4 h-full", // Ensure content uses full height
                    "text-zinc-400 dark:text-zinc-400",
                    "px-4 py-2 rounded-xl", // Symmetrical vertical padding
                    "group"
                )}
            >
                {/* Context title */}
                <div className="flex flex-row items-center gap-2 min-w-0 flex-1 accent-font md:justify-start justify-center md:px-5">
                    {/* <Target size={15} className="hidden md:block" /> */}
                    <h2
                        className={cn(
                            "text-2xl font-extrabold", // Changed font size and weight
                            "truncate text-center md:text-left" // Centered on mobile, left-aligned on medium+ screens
                            // "rounded-md border-2 border-zinc-300 dark:border-zinc-600 px-2" // Optional border
                        )}
                    >
                        {slugToSentenceCase(currentContext)}
                    </h2>
                    {/* <Target size={15} /> */}
                </div>

                {/* Removed Right side - Action buttons div */}
            </div>
            {/* Removed Calendar menu div */}
        </div>
    );
}
