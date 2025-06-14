"use client";

import { cn } from "@/lib/utils";

interface SuggestionsPanelProps {
    showSuggestions: boolean;
}

export function SuggestionsPanel({ showSuggestions }: SuggestionsPanelProps) {
    return (
        <div
            className={cn(
                "sticky flex-col top-0 h-screen overflow-y-auto pt-6 md:pt-12 flex-shrink-0 max-w-full", // MODIFIED: Added flex-shrink-0, max-w-full
                // "bg-zinc-100 dark:bg-zinc-800", // Background
                "bg-zinc-100/50 dark:bg-zinc-800/50",
                "lg:w-1/3 lg:flex lg:border-l lg:border-foreground/10", // Desktop: 1/3 width, flex container, border
                showSuggestions ? "flex w-full z-10" : "hidden lg:flex" // Mobile: full width flex if shown, else hidden. LG: respects lg:flex
            )}
        >
            <div className="text-gray-700 dark:text-gray-300 px-6 md:px-10">
                <h2 className="text-xl font-semibold mb-4">
                    Actions and Suggestions
                </h2>
                <p className="text-sm">
                    This is where AI suggestions and actions will appear. You
                    can use this space to get insights, suggestions, or perform
                    actions based on your notes.
                </p>
                {/* Content for suggestions panel */}
            </div>
        </div>
    );
}
