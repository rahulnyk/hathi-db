"use client";

import { Thread } from "./thread";
import { InputPanel } from "./input_panel";
import { NotesPanelHeader } from "./notes-panel-header"; // Import NotesPanelHeader
import { cn } from "@/lib/utils";

export function NotesPanel() {
    // Removed hidden prop
    return (
        <div
            className={cn(
                "flex flex-col h-full w-full md:max-w-screen-lg md:mx-auto"
            )}
        >
            <NotesPanelHeader /> {/* Add NotesPanelHeader here */}
            <Thread />
            <InputPanel />
        </div>
    );
}
