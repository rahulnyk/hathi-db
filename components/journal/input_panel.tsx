"use client";

import { NotesEditor } from "./notes_editor";
import { NotesPanelHeader } from "./notes_panel_header";
import { cn } from "@/lib/utils";

export function InputPanel() {
    return (
        <div
            className={cn(
                "sticky bottom-0 left-0 right-0 z-10", // Sticky positioning at the bottom
                "bg-background border-t border-border", // Background and top border
                "p-4 md:p-6" // Padding
            )}
        >
            <div className="flex flex-col gap-4">
                <NotesPanelHeader />
                <NotesEditor />
            </div>
        </div>
    );
}
