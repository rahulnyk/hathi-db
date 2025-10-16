"use client";

import { NotesEditor } from "./editor";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";

// No props needed since NotesEditor uses shared context when available
export function InputPanel() {
    const chatMode = useAppSelector((state) => state.ui.chatMode);

    return (
        <div
            className={cn(
                "sticky bottom-4 left-0 right-0 z-10",
                "backdrop-blur-2xl",
                "px-4 py-2 md:px-2 md:py-2", // Padding
                "rounded-2xl", // Rounded corners
                "mx-4",
                // Background and border based on chat mode
                chatMode
                    ? [
                          // Chat mode: blue to purple gradient
                          "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-600/20",
                          "dark:bg-gradient-to-r dark:from-blue-400/25 dark:via-purple-400/25 dark:to-blue-500/25",
                          "border border-blue-300/60 dark:border-blue-400/50",
                          "shadow-lg shadow-blue-500/10 dark:shadow-blue-400/15",
                      ]
                    : [
                          // Normal mode: subtle neutral gradient
                          "bg-gradient-to-r from-zinc-200/50 via-slate-300/50 to-zinc-200/50",
                          "dark:bg-gradient-to-r dark:from-zinc-700/50 dark:via-slate-700/50 dark:to-zinc-700/50",
                          "border border-zinc-300 dark:border-zinc-600",
                      ]
            )}
        >
            <div className="flex flex-col gap-1">
                <NotesEditor />
            </div>
        </div>
    );
}
