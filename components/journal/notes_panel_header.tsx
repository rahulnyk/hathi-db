"use client";

import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";
// Removed unused imports:
// import { useState, useRef, useEffect } from "react";
// import { Calendar, Home } from "lucide-react";
// import { useAppDispatch } from "@/store";
// import { setCurrentContext } from "@/store/notesSlice";
// import { setDatePickerSelectedDate } from "@/store/uiSlice";
// import { dateToSlug } from "@/lib/utils";
// import { DateContextPicker } from "./date_context_picker";
// import { Button } from "@/components/ui/button";

export function NotesPanelHeader() {
    const { currentContext } = useAppSelector((state) => state.notes);
    // Removed state and refs:
    // const [isMenuOpen, setIsMenuOpen] = useState(false);
    // const dispatch = useAppDispatch();
    // const menuRef = useRef<HTMLDivElement>(null);

    // Removed event handlers:
    // const handleCalendarClick = () => { ... };
    // const handleHomeClick = () => { ... };

    // Removed useEffect for click outside:
    // useEffect(() => { ... }, [isMenuOpen]);

    return (
        <div className="w-full"> {/* Removed relative, z-50 and ref */}
            {/* Header bar */}
            <div
                className={cn(
                    "flex flex-row justify-start items-center gap-4", // Changed justify-between to justify-start
                    "text-zinc-400 dark:text-zinc-400",
                    "px-4 rounded-xl", // Retained px-4 and rounded-xl, they seem fine
                    "group"
                )}
            >
                {/* Context title */}
                <div className="flex flex-row items-center gap-4 min-w-0 flex-1 text-foreground/40">
                    <h2
                        className={cn(
                            "text-base font-semibold", // Changed font size and weight
                            "truncate" // Ensures text doesn't overflow
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

                {/* Removed Right side - Action buttons div */}
            </div>

            {/* Removed Calendar menu div */}
        </div>
    );
}
