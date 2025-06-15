"use client";

import { Thread } from "./thread";
import { InputPanel } from "./input_panel";
import { cn } from "@/lib/utils";

export function NotesPanel() { // Removed hidden prop
    return (
        <div
            className={cn(
                "flex flex-col h-full w-full md:max-w-screen-lg md:mx-auto" // Changed to max-width and centered for md+
                // "bg-background" // Removed this class
                // Removed hidden logic
            )}
        >
            <Thread />
            <InputPanel />
        </div>
    );
}
