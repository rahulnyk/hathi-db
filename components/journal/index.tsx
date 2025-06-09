"use client";
import { User } from "@supabase/supabase-js";
// import { useState } from "react";
import { NotesPanel } from "@/components/journal/notes_panel";
// import clsx from "clsx";
import { cn } from "@/lib/utils";
export function JournalComponent({ user }: { user: User }) {
    // const [isRightColumnVisible, setIsRightColumnVisible] = useState(false);
    return (
        <div className="flex flex-row w-full min-h-screen relative">
            <div className="flex p-12 w-2/3 overflow-y-auto">
                <NotesPanel user={user} />
            </div>
            <div
                className={cn(
                    "flex sticky flex-col top-0 min-h-screen overflow-y-auto pt-12",
                    "bg-zinc-100 dark:bg-zinc-800",
                    "border-l border-foreground/10 w-1/3"
                )}
            >
                <div className="text-gray-700 dark:text-gray-300 px-10">
                    <h2 className="text-xl font-semibold mb-4">
                        Actions and Suggestions
                    </h2>
                    <p className="text-sm">
                        This is where AI suggestions and actions will appear.
                        You can use this space to get insights, suggestions, or
                        perform actions based on your notes.
                    </p>
                </div>
            </div>
        </div>
    );
}
