"use client";

import { cn } from "@/lib/utils";
// import { useState } from "react";

interface NotesContextMenuProps {
    isOpen: boolean;
}

export function NotesContextMenu({ isOpen }: NotesContextMenuProps) {
    if (!isOpen) return null;
    // const [date, setDate] = useState<Date | undefined>(new Date());

    return (
        <div
            className={cn(
                "bg-zinc-200/50 dark:bg-zinc-800/50",
                // "absolute z-10 top-16 left-0 right-0",
                "w-full rounded-xl rounded-t-none p-6",
                "backdrop-blur-md",
                // "border border-border/50 border-t-0",
                "shadow-lg",
                "transition-all duration-200 ease-in-out",
                isOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-4 pointer-events-none"
            )}
        >
            {/* Content will go here */}
            <div className="h-48"></div>
        </div>
    );
}
