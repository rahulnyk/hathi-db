"use client";

import type { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Note } from "./notes";
import clsx from "clsx";
import { NoteCard } from "./notes_card";

export function Thread({ user }: { user: User }) {
    const [notes, setNotes] = useState<Note[]>([]);
    const supabase = createClient();

    // Fetch notes on component mount
    useEffect(() => {
        fetchNotes();
    }, []);

    async function fetchNotes() {
        try {
            const { data, error } = await supabase
                .from("notes")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (error) {
            console.error("Error fetching notes:", error);
        }
    }
    return (
        <div className="w-full">
            {notes.length === 0 ? (
                <div className="text-center p-8 border rounded-lg text-muted-foreground">
                    You haven't created any notes yet. Write your first note
                    above!
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
