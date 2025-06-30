"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    SuggestionDropdown,
    SuggestionItem,
} from "@/components/ui/suggestion-dropdown";
import { searchContexts } from "@/app/actions/contexts";
import { ContextStatParams } from "@/app/actions/contexts";
import { cn, slugToSentenceCase } from "@/lib/utils";

export interface ContextSearchBoxProps {
    onContextSelect?: (context: string) => void;
    placeholder?: string;
    className?: string;
    maxSuggestions?: number;
    ref?: React.Ref<HTMLDivElement>;
}

export const ContextSearchBox = ({
    onContextSelect,
    placeholder = "Search contexts...",
    className,
    maxSuggestions = 5,
    ref,
}: ContextSearchBoxProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedContext, setSelectedContext] = useState<string>("");
    const [selectedContextLabel, setSelectedContextLabel] =
        useState<string>("");
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounced search function
    const debouncedSearch = useCallback(
        async (term: string) => {
            if (!term.trim()) {
                setSuggestions([]);
                setIsDropdownOpen(false);
                return;
            }

            setIsLoading(true);
            try {
                const results = await searchContexts(term, maxSuggestions);
                const suggestionItems: SuggestionItem[] = results.map(
                    (context: ContextStatParams) => ({
                        id: context.context,
                        label: slugToSentenceCase(context.context),
                        count: context.count,
                        lastUsed: context.lastUsed,
                        data: context,
                    })
                );
                setSuggestions(suggestionItems);
                setIsDropdownOpen(true);
            } catch (error) {
                console.error("Error searching contexts:", error);
                setSuggestions([]);
                setIsDropdownOpen(false);
            } finally {
                setIsLoading(false);
            }
        },
        [maxSuggestions]
    ); // Handle search input changes
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        const timeoutId = setTimeout(() => {
            // Only search if the search term is different from the selected context label
            // This prevents searching when a context is selected
            if (searchTerm !== selectedContextLabel) {
                debouncedSearch(searchTerm);
            }
        }, 300); // 300ms debounce

        searchTimeoutRef.current = timeoutId;

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm, debouncedSearch, selectedContextLabel]);

    // Handle clicks outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        // If user is typing and has a selected context, clear it
        if (selectedContext && value !== selectedContextLabel) {
            setSelectedContext("");
            setSelectedContextLabel("");
        }
    };

    const handleSuggestionSelect = (item: SuggestionItem) => {
        const contextSlug = (item.data as ContextStatParams).context; // Original slug format
        setSelectedContext(contextSlug);
        setSelectedContextLabel(item.label);
        setSearchTerm(item.label); // Display formatted version
        setIsDropdownOpen(false);
        setSuggestions([]);

        if (onContextSelect) {
            onContextSelect(contextSlug);
        }
    };

    const handleClearSelection = () => {
        setSelectedContext("");
        setSelectedContextLabel("");
        setSearchTerm("");
        setSuggestions([]);
        setIsDropdownOpen(false);
        inputRef.current?.focus();
    };

    const handleInputFocus = () => {
        if (searchTerm && suggestions.length > 0) {
            setIsDropdownOpen(true);
        }
    };
    return (
        <div
            ref={(node) => {
                containerRef.current = node;
                if (typeof ref === "function") {
                    ref(node);
                } else if (ref) {
                    ref.current = node;
                }
            }}
            className={cn("relative", className)}
        >
            <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    <Search size={16} />
                </div>
                <Input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder={placeholder}
                    className={cn("pl-9", selectedContext && "pr-9")}
                />
                {selectedContext && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSelection}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
                    >
                        <X size={14} />
                    </Button>
                )}
            </div>

            <SuggestionDropdown
                items={suggestions}
                isOpen={isDropdownOpen}
                onSelect={handleSuggestionSelect}
                onClose={() => setIsDropdownOpen(false)}
                isLoading={isLoading}
                emptyMessage="No contexts found"
            />
        </div>
    );
};

ContextSearchBox.displayName = "ContextSearchBox";
