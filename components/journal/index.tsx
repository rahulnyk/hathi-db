"use client";
import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { NotesPanel } from "@/components/journal/notes_panel";
import { cn } from "@/lib/utils";

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
                    "p-6 md:p-12 mx-auto my-auto overflow-y-auto", // Adjusted padding for consistency
                    "lg:w-3/4 lg:flex", // Desktop: 3/4 width, flex
                    showSuggestions ? "hidden lg:flex" : "flex w-full" // Mobile: hidden if suggestions shown, else full width
                )}
            >
                <NotesPanel user={user} />
            </div>

            {/* Right column: Actions and Suggestions */}
            <div
                className={cn(
                    "sticky flex-col top-0 h-screen overflow-y-auto pt-6 md:pt-12",
                    "bg-zinc-100 dark:bg-zinc-800",
                    "lg:w-1/4 lg:flex lg:border-l lg:border-foreground/10", // Desktop: 1/4 width, flex, border
                    showSuggestions ? "flex w-full z-10" : "hidden lg:flex" // Mobile: full width if shown (z-10 to be sure it's on top if needed), else hidden
                                                                            // No border-l on mobile full-width view
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
                    // Icon/Text for "Show Notes"
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                ) : (
                    // Icon/Text for "Show Suggestions"
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.354a15.054 15.054 0 01-4.5 0M3.75 12H7.5m12.75 0h-3.75M12 15.75V18m0 2.475a3.75 3.75 0 01-3.75 3.75H8.25A3.75 3.75 0 014.5 18V7.5a3.75 3.75 0 013.75-3.75h7.5A3.75 3.75 0 0119.5 7.5V18a3.75 3.75 0 01-3.75 3.75H12A3.75 3.75 0 0112 15.75z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
