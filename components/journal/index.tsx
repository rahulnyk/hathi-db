"use client";
import { useEffect, useState, createContext } from "react";
import { User } from "@supabase/supabase-js";
import { NotesPanel } from "@/components/journal/notes_panel";
import { SuggestionsPanel } from "./suggestions_panel";
import { TogglePanelButton } from "./toggle_panel_button";
import { useParams } from "next/navigation";
import { useAppDispatch } from "@/store";
import { setCurrentContext } from "@/store/notesSlice";
import { dateToSlug } from "@/lib/utils";
export const UserContext = createContext<User>(null!); // Create a context for user, initialized with null

export function JournalComponent({ user }: { user: User }) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const dispatch = useAppDispatch();

    const handleToggleSuggestions = () => {
        setShowSuggestions(!showSuggestions);
    };

    // Get the keyContext from URL params
    const params = useParams<{ keyContext: string[] }>();

    useEffect(() => {
        // Extract the first element of keyContext array if it exists
        if (params.keyContext && params.keyContext.length > 0) {
            const contextKey = params.keyContext[0];
            // Dispatch to set the current context in Redux store
            dispatch(setCurrentContext(contextKey));
        } else {
            // If no context key in URL, default to today's date
            dispatch(setCurrentContext(dateToSlug(new Date())));
        }
    }, [params.keyContext, dispatch]);

    return (
        <UserContext value={user}>
            <div className="flex flex-col lg:flex-row w-full min-h-screen relative">
                {/* Left column: Notes and Editor */}
                <NotesPanel hidden={showSuggestions} />

                {/* Right column: Actions and Suggestions */}
                <SuggestionsPanel showSuggestions={showSuggestions} />

                {/* Toggle Button for Mobile/Tablet */}
                <TogglePanelButton
                    showSuggestions={showSuggestions}
                    onClick={handleToggleSuggestions}
                />
            </div>
        </UserContext>
    );
}
