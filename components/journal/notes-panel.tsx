"use client";

import { Thread } from "./thread";
import { InputPanel } from "./input-panel";
import { NotesPanelHeader } from "./notes-panel-header";
import { cn } from "@/lib/utils";
import { ToastProvider, ErrorBoundary } from "@/components/ui";

import { useTodayTracker } from "@/hooks/use-today-tracker";

export function NotesPanel() {
    // Track today's date and redirect if it changes
    useTodayTracker();

    return (
        <ToastProvider>
            <ErrorBoundary>
                <div
                    className={cn(
                        "flex flex-col h-screen w-full md:max-w-screen-lg md:mx-auto",
                        "px-4 sm:px-6 md:px-6"
                    )}
                >
                    <NotesPanelHeader />
                    <Thread />
                    <InputPanel />
                </div>
            </ErrorBoundary>
        </ToastProvider>
    );
}
