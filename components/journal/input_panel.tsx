"use client";

import { useState } from "react";
import { NotesEditor } from "./notes_editor";
import { QAInterface } from "./qa/qa-interface";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type InputMode = "notes" | "qa";

export function InputPanel() {
    const [mode, setMode] = useState<InputMode>("notes");

    if (mode === "qa") {
        return (
            <div
                className={cn(
                    "fixed inset-4 z-50 bg-background border rounded-lg shadow-lg",
                    "flex flex-col"
                )}
            >
                <QAInterface onClose={() => setMode("notes")} />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "sticky bottom-4 left-0 right-0 z-10",
                "bg-zinc-200/50 dark:bg-zinc-700/50",
                "backdrop-blur-2xl",
                "border border-zinc-300 dark:border-zinc-600",
                "px-4 py-2 md:px-2 md:py-2",
                "m-4 md:m-4 rounded-2xl"
            )}
        >
            <div className="flex flex-col gap-1">
                {/* Mode Toggle */}
                <div className="flex justify-end mb-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMode("qa")}
                        className="gap-2 text-xs"
                    >
                        <MessageCircle className="h-3 w-3" />
                        Ask AI
                    </Button>
                </div>
                
                <NotesEditor />
            </div>
        </div>
    );
}
