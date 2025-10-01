"use client";

import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { useAppDispatch, useAppSelector } from "@/store";
import { setDatePickerSelectedDate } from "@/store/uiSlice";
import { dateToSlug } from "@/lib/utils";
import { useContextNavigation } from "@/lib/context-navigation";
import { useEffect } from "react";
import {
    fetchDatesWithNotes,
    selectDatesWithNotes,
    selectDatesWithNotesStatus,
    selectDatesWithNotesLoading,
} from "@/store/journalSlice";

/**
 * Props for the DateContextPicker component.
 */
interface DateContextPickerProps {
    /** Whether the date picker is currently open/visible. */
    isOpen: boolean;
    /** Optional callback function to be called when a date is changed. */
    onDateChangeHook?: () => void;
}

export function DateContextPicker({
    isOpen,
    onDateChangeHook,
}: DateContextPickerProps) {
    const selectedDateString = useAppSelector(
        (state) => state.ui.datePickerSelectedDate
    );
    const datesWithNotes = useAppSelector(selectDatesWithNotes);
    const datesStatus = useAppSelector(selectDatesWithNotesStatus);
    const isLoading = useAppSelector(selectDatesWithNotesLoading);

    const selectedDate = new Date(selectedDateString); // Convert string back to Date
    const dispatch = useAppDispatch();
    const { navigateToContext } = useContextNavigation();

    // Fetch dates with notes when the calendar is opened for the first time.
    // Also handle error cases by allowing retry.
    useEffect(() => {
        if (isOpen && (datesStatus === "idle" || datesStatus === "failed")) {
            dispatch(fetchDatesWithNotes());
        }
    }, [isOpen, datesStatus, dispatch]);

    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            // Update the date picker state in Redux (convert Date to string)
            dispatch(setDatePickerSelectedDate(date.toISOString()));

            // Use context navigation hook to properly exit chat mode and navigate to date
            const dateSlug = dateToSlug(date);
            navigateToContext(dateSlug);

            if (onDateChangeHook) {
                // Call the hook
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
                datesWithNotes={datesWithNotes}
            />
        </div>
    ) : null;
}
