"use client";
import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { NotesPanel } from "@/components/journal/notes_panel";
import { SuggestionsPanel } from "./suggestions_panel";
import { TogglePanelButton } from "./toggle_panel_button";
import { createContext } from "react";

export const UserContext = createContext<User>(null!); // Create a context for user, initialized with null

export function JournalComponent({ user }: { user: User }) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const handleToggleSuggestions = () => {
        setShowSuggestions(!showSuggestions);
    };

    return (
        <div className="flex flex-col lg:flex-row w-full min-h-screen relative">
            <UserContext value={user}>
                {/* Left column: Notes and Editor */}

                <NotesPanel hidden={showSuggestions} />

                {/* Right column: Actions and Suggestions */}
                <SuggestionsPanel showSuggestions={showSuggestions} />

                {/* Toggle Button for Mobile/Tablet */}
                <TogglePanelButton
                    showSuggestions={showSuggestions}
                    onClick={handleToggleSuggestions}
                />
            </UserContext>
        </div>
    );
}
