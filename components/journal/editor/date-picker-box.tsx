"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

export interface DatePickerBoxProps {
    isVisible: boolean;
    onDateSelect: (date: Date) => void;
    onClose: () => void;
    className?: string;
}

export const DatePickerBox = ({
    isVisible,
    onDateSelect,
    onClose,
    className,
}: DatePickerBoxProps) => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        undefined
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!isVisible) return;

            switch (event.key) {
                case "Escape":
                    event.preventDefault();
                    event.stopPropagation();
                    onClose();
                    break;
                case "Enter":
                    event.preventDefault();
                    event.stopPropagation();
                    // If no date is selected, default to today's date
                    const dateToSelect = selectedDate || new Date();
                    onDateSelect(dateToSelect);
                    break;
            }
        },
        [isVisible, selectedDate, onDateSelect, onClose]
    );

    // Add keyboard event listeners
    useEffect(() => {
        if (isVisible) {
            document.addEventListener("keydown", handleKeyDown);
            return () => {
                document.removeEventListener("keydown", handleKeyDown);
            };
        }
    }, [handleKeyDown, isVisible]);

    // Handle date selection
    const handleDateChange = (date: Date | undefined) => {
        setSelectedDate(date);
        if (date) {
            onDateSelect(date);
        }
    };

    // Reset selected date when closing
    useEffect(() => {
        if (!isVisible) {
            setSelectedDate(undefined);
        }
    }, [isVisible]);

    if (!isVisible) {
        return null;
    }

    return (
        <div
            className={cn(
                "w-full bg-background border border-border rounded-md shadow-lg",
                "animate-in fade-in-0 slide-in-from-top-2",
                "p-4",
                className
            )}
        >
            <div className="flex flex-col items-center">
                <DatePicker
                    selectedDate={selectedDate}
                    onDateChange={handleDateChange}
                    className="w-full"
                />
            </div>
        </div>
    );
};

DatePickerBox.displayName = "DatePickerBox";
