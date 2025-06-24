"use client";
import { useEffect, createContext } from "react"; // Removed useState
import { User } from "@supabase/supabase-js";
import { NotesPanel } from "@/components/journal/notes_panel";
import { useParams } from "next/navigation";
import { useAppDispatch } from "@/store";
import { setCurrentContext } from "@/store/notesSlice";
import { dateToSlug } from "@/lib/utils";

export const UserContext = createContext<User>(null!); // Create a context for user, initialized with null

export function JournalComponent({ user }: { user: User }) {
    const dispatch = useAppDispatch();
    const params = useParams<{ keyContext: string[] }>();

    useEffect(() => {
        if (params.keyContext && params.keyContext.length > 0) {
            const contextKey = params.keyContext[0];
            dispatch(setCurrentContext(contextKey));
        } else {
            dispatch(setCurrentContext(dateToSlug(new Date())));
        }
    }, [params.keyContext, dispatch]);

    return (
        <UserContext.Provider value={user}>
            <div className="flex justify-center w-full min-h-screen">
                <NotesPanel />
            </div>
        </UserContext.Provider>
    );
}
