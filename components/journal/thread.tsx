"use client";

import { useEffect } from "react";
// import clsx from "clsx";
import { NoteCard } from "./notes_card";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchNotes } from "@/store/notesSlice";
import { useContext } from "react";
import { UserContext } from "@/components/journal";

export function Thread() {
    const user = useContext(UserContext);
    const dispatch = useAppDispatch();
    const { notes, collectionStatus, collectionError, currentContext } =
        useAppSelector((state) => state.notes);

    // Fetch notes on component mount
    useEffect(() => {
        dispatch(fetchNotes({ userId: user.id, contexts: [currentContext] }));
    }, [dispatch, user.id, currentContext]);

    // Show loading state
    if (collectionStatus === "loading" && notes.length === 0) {
        return (
            <div className="w-full flex-grow overflow-y-auto p-4 md:p-6 flex items-center justify-center">
                <div className="text-center p-4 border rounded-lg text-muted-foreground bg-card">
                    Loading notes...
                </div>
            </div>
        );
    }

    // Show error state
    if (collectionStatus === "failed") {
        return (
            <div className="w-full flex-grow overflow-y-auto p-4 md:p-6 flex items-center justify-center">
                <div className="text-center p-4 border rounded-lg text-red-500 bg-card">
                    Error loading notes: {collectionError}
                </div>
            </div>
        );
    }

    // Reverse notes for chat-like display (oldest at top, newest at bottom)
    const reversedNotes = [...notes].reverse();

    return (
        <div className="w-full flex-grow overflow-y-auto p-4 md:p-6">
            {reversedNotes.length === 0 ? (
                <div className="flex-grow flex items-center justify-center h-full">
                    <div className="text-center p-4 border rounded-lg text-muted-foreground bg-card">
                        Write your first note above!
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {reversedNotes.map((note) => (
                        <NoteCard key={note.id} note={note} user={user} />
                    ))}
                </div>
            )}
        </div>
    );
}
