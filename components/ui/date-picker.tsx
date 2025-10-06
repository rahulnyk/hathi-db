"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
} from "lucide-react";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
} from "date-fns";
import { dateToSlug } from "@/lib/utils";

/**
 * Props for the DatePicker component.
 */
interface DatePickerProps {
    /** The currently selected date, if any. */
    selectedDate: Date | undefined;
    /** Callback function called when a date is selected or changed. */
    onDateChange: (date: Date | undefined) => void;
    /** Additional CSS classes to apply to the component. */
    className?: string;
    /** An array of date slugs in 'dd-month-yyyy' format that should be highlighted with a visual indicator. */
    datesWithNotes?: string[];
}

export function DatePicker({
    selectedDate,
    onDateChange,
    className,
    datesWithNotes = [], // Default to an empty array
}: DatePickerProps) {
    const [currentMonth, setCurrentMonth] = React.useState(
        () => selectedDate || new Date()
    );

    // Use a Set for efficient O(1) lookups inside the loop.
    const datesWithNotesSet = React.useMemo(
        () => new Set(datesWithNotes),
        [datesWithNotes]
    );

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get days to show from previous month to fill the first week
    const startDate = new Date(monthStart);
    const dayOfWeek = startDate.getDay();
    const daysFromPrevMonth = dayOfWeek === 0 ? 0 : dayOfWeek;

    // Create full calendar grid (6 weeks x 7 days = 42 days)
    const calendarDays: Date[] = [];

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
        const date = new Date(monthStart);
        date.setDate(date.getDate() - (i + 1));
        calendarDays.push(date);
    }

    // Add days from current month
    calendarDays.push(...days);

    // Add days from next month to complete the grid
    const remainingDays = 42 - calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(monthEnd);
        date.setDate(date.getDate() + i);
        calendarDays.push(date);
    }

    const handlePrevMonth = () => {
        setCurrentMonth((prev) => subMonths(prev, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth((prev) => addMonths(prev, 1));
    };

    const handleDateClick = (date: Date) => {
        onDateChange(date);
        setCurrentMonth(date);
    };

    // const handleTodayClick = () => {
    //     const today = new Date();
    //     onDateChange(today);
    //     setCurrentMonth(today);
    // };

    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    return (
        <div
            className={cn(
                "flex flex-col w-full min-w-[280px] max-w-md mx-auto button-font-secondary",
                className
            )}
        >
            {/* Header with month/year and navigation */}
            <div className="flex items-center justify-between px-6 py-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevMonth}
                    className="h-8 w-8 p-0 hover:bg-accent flex-shrink-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center justify-center space-x-2 flex-1">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-center">
                        {format(currentMonth, "MMMM yyyy")}
                    </span>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextMonth}
                    className="h-8 w-8 p-0 hover:bg-accent flex-shrink-0"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Calendar Grid */}
            <div className="flex flex-col items-center px-4 py-0">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-1 w-full max-w-[280px]">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="h-7 w-9 flex items-center justify-center text-xs font-medium text-muted-foreground"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1 w-full max-w-[280px]">
                    {calendarDays.map((date, index) => {
                        const isCurrentMonthDay = isSameMonth(
                            date,
                            currentMonth
                        );
                        const isSelected =
                            selectedDate && isSameDay(date, selectedDate);
                        const isTodayDate = isToday(date);
                        // Check if the current date, converted to a slug, exists in our Set.
                        const hasNote = datesWithNotesSet.has(dateToSlug(date));

                        return (
                            <button
                                key={index}
                                className={cn(
                                    "h-9 w-9 p-0 relative rounded-md transition-all duration-200 button-font-secondary",
                                    // Hover state - more visible in light theme
                                    "hover:bg-gray-300/70 dark:hover:bg-gray-700",
                                    // Non-current month dates
                                    !isCurrentMonthDay &&
                                        "text-muted-foreground opacity-50",
                                    // Selected date - subtle but distinct background
                                    isSelected &&
                                        "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100",
                                    // Today's date - blue ring when not selected
                                    isTodayDate &&
                                        !isSelected &&
                                        "ring-2 ring-blue-500 ring-inset"
                                )}
                                onClick={() => handleDateClick(date)}
                            >
                                {format(date, "d")}
                                {hasNote && !isSelected && (
                                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full bg-blue-500 shadow-sm"></span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
