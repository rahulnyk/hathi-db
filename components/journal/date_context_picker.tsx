"use client";

import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { useAppDispatch, useAppSelector } from "@/store";
import { setCurrentContext } from "@/store/notesSlice";
import { setDatePickerSelectedDate } from "@/store/uiSlice";
import { dateToSlug } from "@/lib/utils";

interface DateContextPickerProps {
    isOpen: boolean;
    onDateChangeHook?: () => void; // New prop
}

export function DateContextPicker({ isOpen, onDateChangeHook }: DateContextPickerProps) {
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

            if (onDateChangeHook) { // Call the hook
                onDateChangeHook();
            }
        }
    };

    return isOpen ? (
        <div
            className={cn(
                // "bg-zinc-200 dark:bg-zinc-700 border border-border/50", // Removed background and direct border
                // "bg-zinc-200/50 dark:bg-zinc-700/50 backdrop-blur-xl border border-border/50",
                "rounded-md", // Simpler rounding, can be adjusted by parent
                // "shadow-md", // Shadow can be controlled by parent if needed
                "transition-all duration-200 ease-in-out",
                "p-1 flex flex-col items-center justify-center" // Removed w-full
            )}
        >
            <DatePicker
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                className="flex-1 mx-auto my-auto" // Removed w-full from DatePicker's direct class too, as it has internal max-w-sm
            />
        </div>
    ) : null;
}
