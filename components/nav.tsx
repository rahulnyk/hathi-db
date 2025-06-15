"use client";

import { cn, dateToSlug } from "@/lib/utils";
import { ThemeSwitcher } from "./theme-switcher";
import { LogoutButton } from "@/components/logout-button";
import { Home, Calendar } from "lucide-react";
import { DateContextPicker } from "@/components/journal/date_context_picker";
import { useState, useRef, useEffect } from "react";

// import { useAppDispatch } from "@/lib/hooks";
import { useAppDispatch } from "@/store";
// import { setCurrentContext, setDatePickerSelectedDate } from "@/lib/features/journal/journalSlice";
import { setCurrentContext } from "@/store/notesSlice";
import { setDatePickerSelectedDate } from "@/store/uiSlice";
import { Button } from "./ui/button";

export function Nav() {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const dispatch = useAppDispatch();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsCalendarOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    const handleCalendarClick = () => {
        setIsCalendarOpen(!isCalendarOpen);
    };

    const handleHomeClick = () => {
        const today = new Date();
        const todaySlug = dateToSlug(today);

        dispatch(setCurrentContext(todaySlug));
        dispatch(setDatePickerSelectedDate(today.toISOString()));
        setIsCalendarOpen(false);
    };

    return (
        <nav
            className={cn(
                "w-full h-full",
                "flex flex-col items-center",
                "bg-zinc-500/60 dark:bg-zinc-500/60",
                "border-r border-zinc-500/80 dark:border-zinc-500/80",
                "backdrop-blur-lg"
            )}
        >
            <div className="relative flex flex-col h-full w-full items-center pt-16">
                {/* Top button group */}
                <div className="flex flex-col gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleHomeClick}
                        aria-label="Home"
                    >
                        <Home className="h-5 w-5" />
                    </Button>
                    {/* Wrapper for Calendar button and DateContextPicker */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCalendarClick}
                            aria-label="Open calendar"
                        >
                            <Calendar className="h-5 w-5" />
                        </Button>
                        {isCalendarOpen && (
                            <div
                                ref={menuRef}
                                className="absolute left-full ml-4 mt-4 top-28 -translate-y-1/2 z-50"
                            >
                                <DateContextPicker isOpen={isCalendarOpen} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom button group */}
                <div className="mt-auto flex flex-col gap-4 pb-4 items-center mb-6">
                    <ThemeSwitcher />
                    <LogoutButton />
                </div>
            </div>
        </nav>
    );
}
