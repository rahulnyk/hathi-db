"use client";

import * as React from "react";
import { cn, dateToSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, isToday, format, startOfWeek } from "date-fns";

/**
 * Props for the CompactDatePicker component
 */
interface CompactDatePickerProps {
    /** Callback function called when a date is selected */
    onDateSelect: (date: Date) => void;
    /** Additional CSS classes */
    className?: string;
    /** Array of date slugs that should be highlighted */
    datesWithNotes?: string[];
}

/**
 * CompactDatePicker Component
 *
 * A compact date picker that shows 2 weeks of dates (2 rows of 7 days each)
 * with navigation arrows to move forward and backward in time.
 *
 * @param onDateSelect - Callback when a date is selected
 * @param className - Additional CSS classes
 * @param datesWithNotes - Array of date slugs to highlight
 */
export function CompactDatePicker({
    onDateSelect,
    className,
    datesWithNotes = [],
}: CompactDatePickerProps) {
    const [startDate, setStartDate] = React.useState<Date>(() => {
        // Start from the beginning of the current week
        return startOfWeek(new Date(), { weekStartsOn: 0 });
    });

    // Use a Set for efficient O(1) lookups
    const datesWithNotesSet = React.useMemo(
        () => new Set(datesWithNotes),
        [datesWithNotes]
    );

    /**
     * Generates an array of 14 dates (2 weeks) starting from startDate
     */
    const dates = React.useMemo(() => {
        const result: Date[] = [];
        for (let i = 0; i < 14; i++) {
            result.push(addDays(startDate, i));
        }
        return result;
    }, [startDate]);

    /**
     * Moves to the previous week
     */
    const handlePrevious = () => {
        setStartDate((prev) => addDays(prev, -7));
    };

    /**
     * Moves to the next week
     */
    const handleNext = () => {
        setStartDate((prev) => addDays(prev, 7));
    };

    /**
     * Handles date selection
     */
    const handleDateClick = (date: Date) => {
        onDateSelect(date);
    };

    /**
     * Splits dates into two weeks
     */
    const firstWeek = dates.slice(0, 7);
    const secondWeek = dates.slice(7, 14);

    return (
        <div className={cn("w-full", className)}>
            {/* Header with navigation */}
            <div className="flex items-center justify-between mb-2 px-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    className="h-7 w-7 p-0"
                    type="button"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                    {format(startDate, "MMM yyyy")} -{" "}
                    {format(dates[dates.length - 1], "MMM yyyy")}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    className="h-7 w-7 p-0"
                    type="button"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                    <div
                        key={index}
                        className="text-center text-xs font-medium text-muted-foreground h-6 flex items-center justify-center"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* First week */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {firstWeek.map((date, index) => {
                    const slug = dateToSlug(date);
                    const hasNotes = datesWithNotesSet.has(slug);
                    const today = isToday(date);

                    return (
                        <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDateClick(date)}
                            className={cn(
                                "h-8 w-full p-0 text-xs font-normal relative",
                                today &&
                                    "bg-accent text-accent-foreground font-semibold",
                                hasNotes &&
                                    !today &&
                                    "font-semibold text-foreground"
                            )}
                            type="button"
                        >
                            {format(date, "d")}
                            {hasNotes && (
                                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                            )}
                        </Button>
                    );
                })}
            </div>

            {/* Second week */}
            <div className="grid grid-cols-7 gap-1">
                {secondWeek.map((date, index) => {
                    const slug = dateToSlug(date);
                    const hasNotes = datesWithNotesSet.has(slug);
                    const today = isToday(date);

                    return (
                        <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDateClick(date)}
                            className={cn(
                                "h-8 w-full p-0 text-xs font-normal relative",
                                today &&
                                    "bg-accent text-accent-foreground font-semibold",
                                hasNotes &&
                                    !today &&
                                    "font-semibold text-foreground"
                            )}
                            type="button"
                        >
                            {format(date, "d")}
                            {hasNotes && (
                                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                            )}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
