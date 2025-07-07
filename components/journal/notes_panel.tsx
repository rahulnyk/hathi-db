"use client";

import { Thread } from "./thread";
import { InputPanel } from "./input_panel";
import { AssistantPanel } from "./assistant-panel";
import { NotesPanelHeader } from "./notes-panel-header"; // Import NotesPanelHeader
import { useAppSelector } from "@/store";
import { cn } from "@/lib/utils";

export function NotesPanel() {
    const chatMode = useAppSelector((state) => state.ui.chatMode);

    return (
        <div
            className={cn(
                "flex flex-col h-screen w-full md:max-w-screen-lg md:mx-auto"
            )}
        >
            <NotesPanelHeader /> {/* Add NotesPanelHeader here */}
            {chatMode ? <AssistantPanel /> : <Thread />}
            <InputPanel />
        </div>
    );
}
