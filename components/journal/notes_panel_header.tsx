"use client";

import { cn } from "@/lib/utils";
import { NotebookPen } from "lucide-react";
import { useAppSelector } from "@/store";

export function NotesPanelHeader() {
    const { currentContext } = useAppSelector((state) => state.notes);

    return (
        <div
            className={cn(
                "flex flex-row w-full relative p-2 px-4 rounded-2xl justify-start items-center gap-4",
                "text-zinc-400 dark:text-zinc-500",
                "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
        >
            <NotebookPen size={24} />
            <h2
                className={cn(
                    "text-2xl font-extrabold inline-block"
                    // "bg-gradient-to-r from-zinc-500 to-zinc-700",
                    // "bg-clip-text text-transparent"
                )}
            >
                {currentContext
                    .split("-")
                    .map(
                        (word) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                    )
                    .join(" ")}
            </h2>
        </div>
    );
}
