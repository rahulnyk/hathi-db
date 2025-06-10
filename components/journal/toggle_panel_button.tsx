"use client";

import { cn } from "@/lib/utils";
import { FileText, Lightbulb } from "lucide-react";

interface TogglePanelButtonProps {
    showSuggestions: boolean;
    onClick: () => void;
}

export function TogglePanelButton({
    showSuggestions,
    onClick,
}: TogglePanelButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "lg:hidden fixed bottom-6 right-6 z-20 p-4 rounded-full shadow-lg",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "flex items-center justify-center"
            )}
            aria-label={showSuggestions ? "Show Notes" : "Show Suggestions"}
        >
            {showSuggestions ? (
                <FileText
                    className="w-6 h-6"
                    aria-hidden="true"
                    strokeWidth={1.5}
                />
            ) : (
                <Lightbulb
                    className="w-6 h-6"
                    aria-hidden="true"
                    strokeWidth={1.5}
                />
            )}
        </button>
    );
}
