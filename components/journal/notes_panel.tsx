"use client";

import type { User } from "@supabase/supabase-js";
import { NotesEditor } from "./notes_editor";
import { Thread } from "./thread";

export function NotesPanel({ user }: { user: User }) {
    return (
        <div className="flex flex-col w-full relative gap-6 md:gap-8 lg:gap-12">
            {/* Note input section */}
            <NotesEditor user={user} />

            {/* Notes list section */}
            <Thread user={user} />
        </div>
    );
}
