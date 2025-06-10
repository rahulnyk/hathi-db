"use client";
import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { NotesPanel } from "@/components/journal/notes_panel";
import { cn } from "@/lib/utils";
import { FileText, Lightbulb } from "lucide-react";

// Placeholder for a proper SuggestionsPanel component if it were separate
// For now, the content is directly in the layout.
// import { SuggestionsPanel } from "@/components/journal/suggestions_panel";

export function JournalComponent({ user }: { user: User }) {
    const [showSuggestions, setShowSuggestions] = useState(false);

    return (
        <div className="flex flex-col lg:flex-row w-full min-h-screen relative">
            {/* Left column: Notes and Editor */}
            <div
                className={cn(
                    "p-6 md:p-12 mx-auto my-auto overflow-y-auto flex-grow max-w-full", // MODIFIED: Added flex-grow, max-w-full
                    "lg:w-2/3 lg:flex", // Desktop: 2/3 width, flex container
                    showSuggestions ? "hidden lg:flex" : "flex w-full" // Mobile: hidden if suggestions shown, else full width flex. LG: respects lg:flex
                )}
            >
                <NotesPanel user={user} />
            </div>

            {/* Right column: Actions and Suggestions */}
            <div
                className={cn(
                    "sticky flex-col top-0 h-screen overflow-y-auto pt-6 md:pt-12 flex-shrink-0 max-w-full", // MODIFIED: Added flex-shrink-0, max-w-full
                    "bg-zinc-100 dark:bg-zinc-800", // Background
                    "lg:w-1/3 lg:flex lg:border-l lg:border-foreground/10", // Desktop: 1/3 width, flex container, border
                    showSuggestions ? "flex w-full z-10" : "hidden lg:flex" // Mobile: full width flex if shown, else hidden. LG: respects lg:flex
                )}
            >
                <div className="text-gray-700 dark:text-gray-300 px-6 md:px-10">
                    <h2 className="text-xl font-semibold mb-4">
                        Actions and Suggestions
                    </h2>
                    <p className="text-sm">
                        This is where AI suggestions and actions will appear.
                        You can use this space to get insights, suggestions, or
                        perform actions based on your notes.
                    </p>
                    {/* Content for suggestions panel */}
                </div>
            </div>

            {/* Toggle Button for Mobile/Tablet */}
            <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className={cn(
                    "lg:hidden fixed bottom-6 right-6 z-20 p-4 rounded-full shadow-lg",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "flex items-center justify-center"
                )}
                aria-label={showSuggestions ? "Show Notes" : "Show Suggestions"}
            >
                {showSuggestions ? (
                    <FileText
                        className="w-6 h-6"
                        aria-hidden="true"
                        strokeWidth={1.5}
                    />
                ) : (
                    <Lightbulb
                        className="w-6 h-6"
                        aria-hidden="true"
                        strokeWidth={1.5}
                    />
                )}
            </button>
        </div>
    );
}
