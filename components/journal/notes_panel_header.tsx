"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { NotebookPen, Calendar, Home } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import { setCurrentContext } from "@/store/notesSlice";
import { setDatePickerSelectedDate } from "@/store/uiSlice";
import { dateToSlug } from "@/lib/utils";
import { DateContextPicker } from "./date_context_picker";
import { Button } from "@/components/ui/button";

export function NotesPanelHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { currentContext } = useAppSelector((state) => state.notes);
    const dispatch = useAppDispatch();
    const menuRef = useRef<HTMLDivElement>(null);

    const handleCalendarClick = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleHomeClick = () => {
        const today = new Date();

        // Update both the current context and the date picker selected date
        dispatch(setCurrentContext(dateToSlug(today)));
        dispatch(setDatePickerSelectedDate(today.toISOString())); // Convert to string

        setIsMenuOpen(false); // Close menu if open
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
        <div className="relative z-50 w-full" ref={menuRef}>
            {/* Header bar */}
            <div
                className={cn(
                    "flex flex-row justify-between items-center gap-4",
                    "text-zinc-400 dark:text-zinc-400",
                    "px-4 rounded-xl",
                    "group"
                )}
            >
                {/* Left side - Context title */}
                <div className="flex flex-row items-center gap-4 min-w-0 flex-1 text-foreground/40">
                    <NotebookPen size={22} className="flex-shrink-0" />
                    <h2
                        className={cn(
                            "text-xl sm:text-2xl font-extrabold",
                            "truncate" // Ensures text doesn't overflow on small screens
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

                {/* Right side - Action buttons */}
                <div className="flex flex-row items-center gap-3 flex-shrink-0">
                    {/* Calendar button */}
                    <Button
                        variant="ghost"
                        size="bigIcon"
                        onClick={handleCalendarClick}
                        className={cn(
                            "hover:bg-accent hover:text-accent-foreground",
                            "transition-colors border border-transparent",
                            "hover:border-border/50",
                            isMenuOpen &&
                                "bg-accent text-accent-foreground border-border/50"
                        )}
                        title="Open Calendar"
                    >
                        <Calendar />
                    </Button>

                    {/* Home button */}
                    <Button
                        variant="ghost"
                        size="bigIcon"
                        onClick={handleHomeClick}
                        className={cn(
                            "hover:bg-accent hover:text-accent-foreground",
                            "transition-colors border border-transparent",
                            "hover:border-border/50"
                        )}
                        title="Go to Today"
                    >
                        <Home />
                    </Button>
                </div>
            </div>

            {/* Calendar menu */}
            <div className="absolute w-auto max-w-sm right-0">
                <DateContextPicker isOpen={isMenuOpen} />
            </div>
        </div>
    );
}
