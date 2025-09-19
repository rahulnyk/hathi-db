"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface SuggestionItem {
    id: string;
    label: string;
    count?: number;
    lastUsed?: string;
    data?: unknown; // For extensibility
}

export interface SuggestionDropdownProps {
    items: SuggestionItem[];
    isOpen: boolean;
    onSelect: (item: SuggestionItem) => void;
    onClose?: () => void;
    isLoading?: boolean;
    className?: string;
    emptyMessage?: string;
    maxHeight?: string;
    ref?: React.Ref<HTMLDivElement>;
}

export const SuggestionDropdown = ({
    items,
    isOpen,
    onSelect,
    onClose,
    isLoading = false,
    className,
    emptyMessage = "No suggestions found",
    maxHeight = "max-h-48",
    ref,
}: SuggestionDropdownProps) => {
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Reset selected index when items change or dropdown opens/closes
    useEffect(() => {
        if (!isOpen || items.length === 0) {
            setSelectedIndex(-1);
        }
    }, [isOpen, items]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || items.length === 0) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev < items.length - 1 ? prev + 1 : 0
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev > 0 ? prev - 1 : items.length - 1
                    );
                    break;
                case "Enter":
                    e.preventDefault();
                    if (selectedIndex >= 0 && selectedIndex < items.length) {
                        onSelect(items[selectedIndex]);
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    setSelectedIndex(-1);
                    onClose?.(); // Call the onClose callback
                    break;
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen, items, selectedIndex, onSelect, onClose]); // Add onClose to dependencies

    if (!isOpen) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50",
                maxHeight,
                "overflow-y-auto",
                className
            )}
        >
            {isLoading ? (
                <div className="flex items-center justify-center py-3 px-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    <span className="ml-2 menu-font">Searching...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="py-3 px-4 menu-font">{emptyMessage}</div>
            ) : (
                <div className="py-1">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className={cn(
                                "flex items-center justify-between px-4 py-2 cursor-pointer transition-colors",
                                selectedIndex === index
                                    ? "bg-accent text-accent-foreground"
                                    : "hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <span className="menu-font truncate">
                                {item.label}
                            </span>
                            {item.count !== undefined && (
                                <span
                                    className={cn(
                                        "ml-2 text-xs rounded-full px-2 py-0.5 font-semibold",
                                        selectedIndex === index
                                            ? "bg-accent-foreground/10 text-accent-foreground"
                                            : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {item.count}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

SuggestionDropdown.displayName = "SuggestionDropdown";
