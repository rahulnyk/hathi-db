"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { NotebookPen } from "lucide-react";
import { useAppSelector } from "@/store";
import { NotesContextMenu } from "./notes_context_menu";

export function NotesPanelHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { currentContext } = useAppSelector((state) => state.notes);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleToggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Handle clicks outside of the component
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        }

        // Only add the event listener if the menu is open
        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMenuOpen]);

    return (
        <div className="relative w-full" ref={menuRef}>
            {/* Header bar */}
            <div
                className={cn(
                    "flex flex-row w-full justify-start items-center gap-4",
                    "text-zinc-400 dark:text-zinc-500",
                    "cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors",
                    isMenuOpen && "bg-zinc-200/50 dark:bg-zinc-800/50",
                    "hover:bg-zinc-200/50 hover:dark:bg-zinc-800/50",
                    "group",
                    "p-4 rounded-t-xl"
                )}
                onClick={handleToggleMenu}
            >
                <NotebookPen
                    size={24}
                    className="group-hover:text-primary transition-colors"
                />
                <h2
                    className={cn(
                        "text-2xl font-extrabold inline-block transition-colors",
                        "group-hover:text-foreground"
                    )}
                >
                    {currentContext
                        .split("-")
                        .map(
                            (word) =>
                                word.charAt(0).toUpperCase() +
                                word.slice(1).toLowerCase()
                        )
                        .join(" ")}
                </h2>
            </div>

            {/* Context menu */}
            <div className="absolute w-full">
                <NotesContextMenu isOpen={isMenuOpen} />
            </div>
        </div>
    );
}
