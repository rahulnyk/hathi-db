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

interface DatePickerProps {
    selectedDate: Date | undefined;
    onDateChange: (date: Date | undefined) => void;
    className?: string;
}

export function DatePicker({
    selectedDate,
    onDateChange,
    className,
}: DatePickerProps) {
    const [currentMonth, setCurrentMonth] = React.useState(
        () => selectedDate || new Date()
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

    const handleTodayClick = () => {
        const today = new Date();
        onDateChange(today);
        setCurrentMonth(today);
    };

    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    return (
        <div
            className={cn(
                "flex flex-col w-full min-w-[280px] max-w-sm mx-auto accent-font-active",
                className
            )}
        >
            {/* Header with month/year and navigation */}
            <div className="flex items-center justify-between px-6 py-2">
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
            <div className="flex flex-col items-center px-4 py-1">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-2 w-full max-w-[224px]">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="h-8 w-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1 w-full max-w-[224px]">
                    {calendarDays.map((date, index) => {
                        const isCurrentMonth = isSameMonth(date, currentMonth);
                        const isSelected =
                            selectedDate && isSameDay(date, selectedDate);
                        const isTodayDate = isToday(date);

                        return (
                            <Button
                                key={index}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDateClick(date)}
                                className={cn(
                                    "h-8 w-8 p-0 text-xs font-normal",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    "flex items-center justify-center",
                                    !isCurrentMonth &&
                                        "text-muted-foreground opacity-50",
                                    isSelected &&
                                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                                    isTodayDate &&
                                        !isSelected &&
                                        "bg-accent font-medium",
                                    "transition-colors"
                                )}
                            >
                                {format(date, "d")}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Footer with Today button */}
            <div className="px-2 py-2 border-t">
                <Button
                    variant="default"
                    size="sm"
                    onClick={handleTodayClick}
                    className="w-full h-9 text-sm"
                >
                    Today
                </Button>
            </div>
        </div>
    );
}
