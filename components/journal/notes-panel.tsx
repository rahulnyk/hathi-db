"use client";

import { Thread } from "./thread";
import { InputPanel } from "./input-panel";
import { AssistantPanel } from "./assistant-panel";
import { NotesPanelHeader } from "./notes-panel-header";
import { useAppSelector } from "@/store";
import { cn } from "@/lib/utils";
import { ToastProvider, ErrorBoundary } from "@/components/ui";

export function NotesPanel() {
    const chatMode = useAppSelector((state) => state.ui.chatMode);

    return (
        <ToastProvider>
            <ErrorBoundary>
                <div
                    className={cn(
                        "flex flex-col h-screen w-full md:max-w-screen-lg md:mx-auto"
                    )}
                >
                    <NotesPanelHeader />
                    {chatMode ? <AssistantPanel /> : <Thread />}
                    <InputPanel />
                </div>
            </ErrorBoundary>
        </ToastProvider>
    );
}
