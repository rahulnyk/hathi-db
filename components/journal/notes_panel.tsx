"use client";

import { NotesEditor } from "./notes_editor";
import { Thread } from "./thread";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";
import { NotebookPen } from "lucide-react"; // Assuming you have a Disc icon from lucide-react

export function NotesPanel({ hidden = false }: { hidden?: boolean }) {
    const { currentContext } = useAppSelector((state) => state.notes);

    return (
        <div
            className={cn(
                "p-6 md:p-12 mx-auto my-auto overflow-y-auto flex-grow max-w-full", // MODIFIED: Added flex-grow, max-w-full
                "lg:w-2/3 lg:flex", // Desktop: 2/3 width, flex container
                hidden ? "hidden lg:flex" : "flex w-full" // Mobile: hidden if suggestions shown, else full width flex. LG: respects lg:flex
            )}
        >
            <div className="flex flex-col w-full relative gap-6 md:gap-8 lg:gap-8">
                <div
                    className={cn(
                        "flex flex-row w-full relative mx-4 justify-start items-center gap-4",
                        "text-zinc-400 dark:text-zinc-500"
                    )}
                >
                    {/* Context header */}
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
                {/* Note input section */}
                <NotesEditor />

                {/* Notes list section */}
                <Thread />
            </div>
        </div>
    );
}
