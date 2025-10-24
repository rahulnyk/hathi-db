"use client";
import { useEffect } from "react";
import { NotesPanel } from "@/components/journal/notes-panel";
import { useParams } from "next/navigation";
import { useAppDispatch } from "@/store";
import { setCurrentContext } from "@/store/notesSlice";
import { dateToSlug } from "@/lib/utils";

export function JournalComponent() {
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
        <div className="flex justify-center w-full min-h-screen">
            <NotesPanel />
        </div>
    );
}
