"use client";

import { NotesEditor } from "./notes_editor";
import { cn } from "@/lib/utils";

export function InputPanel() {
    return (
        <div
            className={cn(
                "sticky bottom-4 left-0 right-0 z-10",
                "bg-zinc-200/50 dark:bg-zinc-700/50",
                "backdrop-blur-2xl",
                "border border-zinc-300 dark:border-zinc-600", // Border color
                "px-4 py-2 md:px-2 md:py-2", // Padding
                "rounded-2xl", // Rounded corners
                "mx-4"
            )}
        >
            <div className="flex flex-col gap-1">
                <NotesEditor />
            </div>
        </div>
    );
}
