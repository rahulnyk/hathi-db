"use client";

import { PlusCircle } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/textarea";

import type { Note } from "./notes";
import clsx from "clsx";

export function NotesEditor({ user }: { user: User }) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState("");
    const [isLoading, setIsLoading] = useState(false);
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

    async function saveNote() {
        if (!newNote.trim()) return;

        setIsLoading(true);

        try {
            const { data, error } = await supabase
                .from("notes")
                .insert([
                    {
                        content: newNote,
                        user_id: user.id,
                    },
                ])
                .select();

            if (error) throw error;

            if (data) {
                setNotes([data[0], ...notes]);
                setNewNote("");
            }
        } catch (error) {
            console.error("Error saving note:", error);
        } finally {
            setIsLoading(false);
        }
    }
    return (
        <div className="w-full rounded-lg p-4 pt-8 bg-zinc-50 dark:bg-zinc-900">
            <Textarea
                placeholder="Write your note in markdown format..."
                className={clsx(
                    "min-h-48 mb-4 bg-transparent border-none outline-none",
                    "focus:ring-0 focus:border-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                )}
                value={newNote}
                onChange={(e: any) => setNewNote(e.target.value)}
            />
            <div className="flex justify-end items-center">
                <Button
                    onClick={saveNote}
                    disabled={isLoading || !newNote.trim()}
                    className="flex items-center gap-2"
                >
                    <PlusCircle size={16} />
                    Save Note
                </Button>
            </div>
        </div>
    );
}
