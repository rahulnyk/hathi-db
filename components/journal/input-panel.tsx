"use client";

import { NotesEditor } from "./editor";
import { cn } from "@/lib/utils";

// No props needed since NotesEditor uses shared context when available
export function InputPanel() {
    return (
        <div
            className={cn(
                "sticky bottom-6 z-10 mx-4",
                "rounded-xl",
                "bg-zinc-50/90 dark:bg-zinc-900/90",
                "border border-zinc-300/50 dark:border-zinc-600/50",
                "shadow-sm backdrop-blur-sm",
                "p-3"
            )}
        >
            <div className="flex flex-col gap-1">
                <NotesEditor />
            </div>
        </div>
    );
}
