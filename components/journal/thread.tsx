"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect } from "react";
// import clsx from "clsx";
import { NoteCard } from "./notes_card";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchNotes } from "@/store/notesSlice";

export function Thread({ user }: { user: User }) {
    const dispatch = useAppDispatch();
    const { notes, collectionStatus, collectionError } = useAppSelector(
        (state) => state.notes
    );

    // Fetch notes on component mount
    useEffect(() => {
        dispatch(fetchNotes(user.id));
    }, [dispatch, user.id]);

    // Show loading state
    if (collectionStatus === "loading" && notes.length === 0) {
        return (
            <div className="w-full">
                <div className="text-center p-8 border rounded-lg text-muted-foreground">
                    Loading notes...
                </div>
            </div>
        );
    }

    // Show error state
    if (collectionStatus === "failed") {
        return (
            <div className="w-full">
                <div className="text-center p-8 border rounded-lg text-red-500">
                    Error loading notes: {collectionError}
                </div>
            </div>
        );
    }
    return (
        <div className="w-full">
            {notes.length === 0 ? (
                <div className="text-center p-8 border rounded-lg text-muted-foreground">
                    Write your first note above!
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {notes.map((note) => (
                        <NoteCard key={note.id} note={note} />
                    ))}
                </div>
            )}
        </div>
    );
}
