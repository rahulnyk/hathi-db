"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { useAppDispatch } from "@/store";
import { setCurrentContext } from "@/store/notesSlice";
import { dateToSlug } from "@/lib/utils";

interface DateContextPickerProps {
    isOpen: boolean;
}

export function DateContextPicker({ isOpen }: DateContextPickerProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        new Date()
    );
    const dispatch = useAppDispatch();

    const handleDateChange = (date: Date | undefined) => {
        setSelectedDate(date);
        if (date) {
            // Update the current context in Redux when date changes
            dispatch(setCurrentContext(dateToSlug(date)));
        }
    };

    return isOpen ? (
        <div
            className={cn(
                "bg-zinc-200/50 dark:bg-zinc-700/50 backdrop-blur-xl border border-border/50",
                "rounded-xl shadow-md",
                "transition-all duration-200 ease-in-out",
                "w-auto max-w-sm mx-auto p-2 flex flex-col items-center justify-center"
            )}
        >
            <DatePicker
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                className="flex-1 mx-auto my-auto"
            />
        </div>
    ) : null;
}
