"use client";

import { NotesEditor } from "./notes_editor";
import { Thread } from "./thread";
import { NotesPanelHeader } from "./notes_panel_header";
import { cn } from "@/lib/utils";

export function NotesPanel({ hidden = false }: { hidden?: boolean }) {
    return (
        <div
            className={cn(
                "p-6 md:p-12 overflow-y-auto flex-grow max-w-full",
                "lg:w-2/3 lg:flex", // Desktop: 2/3 width, flex container
                hidden ? "hidden lg:flex" : "flex w-full" // Mobile: hidden if suggestions shown, else full width flex. LG: respects lg:flex
            )}
        >
            <div className="flex flex-col w-full relative gap-4 md:gap-4 lg:gap-4">
                {/* Context header with self-contained menu state */}
                <NotesPanelHeader />

                {/* Note input section */}
                <NotesEditor />

                {/* Notes list section */}
                <Thread />
            </div>
        </div>
    );
}
