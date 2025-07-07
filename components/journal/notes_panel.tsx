"use client";

import { Thread } from "./thread";
import { InputPanel } from "./input_panel";
import { AssistantPanel } from "./assistant-panel";
import { NotesPanelHeader } from "./notes-panel-header";
import { useAppSelector } from "@/store";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";

export function NotesPanel() {
    const chatMode = useAppSelector((state) => state.ui.chatMode);

    // Create chat hook for assistant mode
    const chatHook = useChat({
        api: "/api/chat",
    });

    return (
        <div
            className={cn(
                "flex flex-col h-screen w-full md:max-w-screen-lg md:mx-auto"
            )}
        >
            <NotesPanelHeader />
            {chatMode ? <AssistantPanel chatHook={chatHook} /> : <Thread />}
            <InputPanel chatHook={chatHook} />
        </div>
    );
}
