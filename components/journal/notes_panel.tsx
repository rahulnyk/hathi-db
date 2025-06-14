"use client";

import { Thread } from "./thread";
import { InputPanel } from "./input_panel";
import { cn } from "@/lib/utils";

export function NotesPanel({ hidden = false }: { hidden?: boolean }) {
    return (
        <div
            className={cn(
                "flex flex-col h-full w-full",
                "bg-background", // Added for visual debugging and good practice
                hidden ? "hidden lg:flex" : "flex" // Ensure 'flex' is base when not hidden
            )}
        >
            <Thread />
            <InputPanel />
        </div>
    );
}
