"use client";

import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { useAppDispatch, useAppSelector } from "@/store";
import { setCurrentContext } from "@/store/notesSlice";
import { setDatePickerSelectedDate } from "@/store/uiSlice";
import { dateToSlug } from "@/lib/utils";

interface DateContextPickerProps {
    isOpen: boolean;
}

export function DateContextPicker({ isOpen }: DateContextPickerProps) {
    const selectedDateString = useAppSelector(
        (state) => state.ui.datePickerSelectedDate
    );
    const selectedDate = new Date(selectedDateString); // Convert string back to Date
    const dispatch = useAppDispatch();

    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            // Update the date picker state in Redux (convert Date to string)
            dispatch(setDatePickerSelectedDate(date.toISOString()));

            // Update the current context in Redux when date changes (existing behavior)
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
