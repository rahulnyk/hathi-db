"use client";

import type { User } from "@supabase/supabase-js";
import { NotesEditor } from "./notes_editor";
import { Thread } from "./thread";

export type Note = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
};

export function Notes({ user }: { user: User }) {
    return (
        <>
            {/* Note input section */}
            <NotesEditor user={user} />

            {/* Notes list section */}
            <Thread user={user} />
        </>
    );
}
