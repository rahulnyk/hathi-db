"use client";

import { InfoIcon, PlusCircle } from "lucide-react";
import { withAuth } from "@/components/auth/with-auth";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/textarea";

type Note = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
};

function Notes({ user }: { user: User }) {
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
        <div className="flex-1 w-full flex flex-col gap-8">
            <div className="w-full">
                <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
                    <InfoIcon size="16" strokeWidth={2} />
                    Create and view your markdown notes
                </div>
            </div>

            {/* Note input section */}
            <div className="w-full border rounded-lg p-4">
                <h2 className="font-bold text-xl mb-4">Create a new note</h2>
                <Textarea
                    placeholder="Write your note in markdown format..."
                    className="min-h-32 mb-4"
                    value={newNote}
                    onChange={(e: any) => setNewNote(e.target.value)}
                />
                <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                        Supports markdown formatting
                    </div>
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

            {/* Notes list section */}
            <div className="w-full">
                <h2 className="font-bold text-xl mb-4">Your Notes</h2>

                {notes.length === 0 ? (
                    <div className="text-center p-8 border rounded-lg text-muted-foreground">
                        You haven't created any notes yet. Write your first note
                        above!
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {notes.map((note) => (
                            <div
                                key={note.id}
                                className="border rounded-lg p-4"
                            >
                                <div className="text-xs text-muted-foreground mb-2">
                                    {new Date(note.created_at).toLocaleString()}
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown>
                                        {note.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default withAuth(Notes);
