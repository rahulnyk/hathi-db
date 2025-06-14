"use client";

import { NotesEditor } from "./notes_editor";
import { Thread } from "./thread";
import { NotesPanelHeader } from "./notes_panel_header";
import { InputPanel } from "./input_panel"; // Added import
import { cn } from "@/lib/utils";

export function NotesPanel({ hidden = false }: { hidden?: boolean }) {
    return (
        <div
            className={cn(
                "p-0 overflow-y-auto flex-grow max-w-full flex-col h-full", // Changed h-screen to h-full
                hidden ? "hidden lg:flex" : "flex w-full" // Mobile: hidden if suggestions shown, else full width flex. LG: respects lg:flex
            )}
        >
            <div className="flex flex-col w-full relative gap-4 md:gap-4 lg:gap-4 h-full">
                {/* Notes list section */}
                <Thread />

                {/* Input Panel */}
                <InputPanel />
            </div>
        </div>
    );
}
