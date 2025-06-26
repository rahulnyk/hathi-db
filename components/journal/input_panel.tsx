"use client";

import { NotesEditor } from "./notes_editor";
import { NotesPanelHeader } from "./notes_panel_header";
import { cn } from "@/lib/utils";

export function InputPanel() {
    return (
        <div
            className={cn(
                "sticky bottom-4 left-0 right-0 z-10", // Sticky positioning at the bottom
                // "border-t border-border", // Background and top border
                "bg-zinc-200/50 dark:bg-zinc-700/50", // Background color
                "backdrop-blur-2xl",
                "border border-zinc-300 dark:border-zinc-600", // Border color
                "px-4 py-2 md:px-2 md:py-2", // Padding
                "m-4 md:m-4 rounded-2xl" // Margin for spacing
            )}
        >
            <div className="flex flex-col gap-1">
                {/* <NotesPanelHeader /> */}
                <NotesEditor />
            </div>
        </div>
    );
}
