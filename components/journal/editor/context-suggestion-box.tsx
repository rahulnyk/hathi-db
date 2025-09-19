"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { searchContexts } from "@/app/actions/contexts";
import { ContextStats } from "@/db/types";
import { cn, slugToSentenceCase } from "@/lib/utils";
import { useDebounce } from "use-debounce";

export interface SuggestionItem {
    id: string;
    label: string;
    count?: number;
    lastUsed?: Date;
    data: ContextStats;
}

export interface ContextSuggestionBoxProps {
    searchTerm: string;
    isVisible: boolean;
    onContextSelect: (context: string) => void;
    onClose: () => void;
    maxSuggestions?: number;
    className?: string;
}

export const ContextSuggestionBox = ({
    searchTerm,
    isVisible,
    onContextSelect,
    onClose,
    maxSuggestions = 5,
    className,
}: ContextSuggestionBoxProps) => {
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Use debounce to avoid too many API calls
    const [debouncedSearchTerm] = useDebounce(searchTerm, 200);

    // Search function
    const performSearch = useCallback(
        async (term: string) => {
            if (!term.trim() || term.length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                const results = await searchContexts(term, maxSuggestions);
                const suggestionItems: SuggestionItem[] = results.map(
                    (context: ContextStats) => ({
                        id: context.context,
                        label: slugToSentenceCase(context.context),
                        count: context.count,
                        lastUsed: context.lastUsed
                            ? new Date(context.lastUsed)
                            : undefined,
                        data: context,
                    })
                );
                setSuggestions(suggestionItems);
                setSelectedIndex(0); // Reset selection to first item
            } catch (error) {
                console.error("Error searching contexts:", error);
                setSuggestions([]);
            }
        },
        [maxSuggestions]
    );

    // Effect that triggers search when debounced search term changes
    useEffect(() => {
        if (isVisible) {
            performSearch(debouncedSearchTerm);
        } else {
            setSuggestions([]);
        }
    }, [debouncedSearchTerm, isVisible, performSearch]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!isVisible || suggestions.length === 0) return;

            switch (event.key) {
                case "ArrowDown":
                    event.preventDefault();
                    event.stopPropagation();
                    setSelectedIndex((prev) =>
                        prev < suggestions.length - 1 ? prev + 1 : 0
                    );
                    break;
                case "ArrowUp":
                    event.preventDefault();
                    event.stopPropagation();
                    setSelectedIndex((prev) =>
                        prev > 0 ? prev - 1 : suggestions.length - 1
                    );
                    break;
                case "Enter":
                case "Tab":
                    event.preventDefault();
                    event.stopPropagation();
                    if (suggestions[selectedIndex]) {
                        onContextSelect(
                            suggestions[selectedIndex].data.context
                        );
                    }
                    break;
                case "Escape":
                    event.preventDefault();
                    event.stopPropagation();
                    onClose();
                    break;
            }
        },
        [isVisible, suggestions, selectedIndex, onContextSelect, onClose]
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

    if (!isVisible || suggestions.length === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                "w-full bg-background border border-border rounded-md shadow-lg",
                "animate-in fade-in-0 slide-in-from-top-2",
                className
            )}
        >
            <div className="p-2">
                {suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={suggestion.id}
                                className={cn(
                                    "px-3 py-1.5 rounded-md transition-colors flex items-center gap-2",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    "focus:bg-accent focus:text-accent-foreground",
                                    "border border-border",
                                    index === selectedIndex &&
                                        "bg-accent text-accent-foreground border-accent-foreground"
                                )}
                                onClick={() =>
                                    onContextSelect(suggestion.data.context)
                                }
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <span className="truncate max-w-32 menu-font">
                                    {suggestion.label}
                                </span>
                                {suggestion.count && (
                                    <span className="menu-font bg-muted px-1.5 py-0.5 rounded">
                                        {suggestion.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

ContextSuggestionBox.displayName = "ContextSuggestionBox";
