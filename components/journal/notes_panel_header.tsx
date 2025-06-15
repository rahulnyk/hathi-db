"use client";

import { cn, slugToSentenceCase } from "@/lib/utils"; // Added slugToSentenceCase
import { useAppSelector } from "@/store";
import { Target } from "lucide-react"; // Importing Target icon
export function NotesPanelHeader() {
    const { currentContext } = useAppSelector((state) => state.notes);

    return (
        <div className="w-full">
            <div
                className={cn(
                    "flex flex-row justify-start items-center gap-4", // Changed justify-between to justify-start
                    "text-zinc-400 dark:text-zinc-400",
                    "px-2 pt-2 rounded-xl", // Retained px-4 and rounded-xl, they seem fine
                    "group"
                )}
            >
                {/* Context title */}
                <div className="flex flex-row items-center gap-2 min-w-0 flex-1 accent-font">
                    <Target size={15} />
                    <h2
                        className={cn(
                            "text-base font-extrabold", // Changed font size and weight
                            "truncate" // Ensures text doesn't overflow
                        )}
                    >
                        {slugToSentenceCase(currentContext)}
                    </h2>
                </div>

                {/* Removed Right side - Action buttons div */}
            </div>
            {/* Removed Calendar menu div */}
        </div>
    );
}
