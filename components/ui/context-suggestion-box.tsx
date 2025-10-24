"use client";

import * as React from "react";
import { useEffect, useCallback } from "react";
import { cn, slugToSentenceCase } from "@/lib/utils";
import { CompactDatePicker } from "./compact-date-picker";
import { searchContexts } from "@/app/actions/contexts";
import { useAppSelector, useAppDispatch } from "@/store";
import {
    selectEditorSuggestionState,
    setSuggestions,
    setLoading,
    setSelectedIndex,
    ContextSuggestionItem,
} from "@/store/contextSuggestionSlice";
import { useDebounce } from "use-debounce";
import { selectDatesWithNotes } from "@/store/journalSlice";
import { format } from "date-fns";

/**
 * Props for the ContextSuggestionBox component
 */
interface ContextSuggestionBoxProps {
    /** Unique identifier for the editor instance */
    editorId: string;
    /** Callback when a context is selected */
    onContextSelect: (context: string) => void;
    /** Additional CSS classes */
    className?: string;
}

/**
 * ContextSuggestionBox Component
 *
 * Displays a suggestion box with a compact date picker and context suggestions.
 * Layout is responsive: vertical on mobile, horizontal on larger screens.
 *
 * @param editorId - Unique identifier for the editor instance
 * @param onContextSelect - Callback when a context (date or text) is selected
 * @param className - Additional CSS classes
 */
export function ContextSuggestionBox({
    editorId,
    onContextSelect,
    className,
}: ContextSuggestionBoxProps) {
    const dispatch = useAppDispatch();
    const suggestionState = useAppSelector((state) =>
        selectEditorSuggestionState(state, editorId)
    );
    const datesWithNotes = useAppSelector(selectDatesWithNotes);
    const deviceType = useAppSelector((state) => state.ui.deviceType);

    const query = suggestionState?.query ?? "";
    const suggestions = suggestionState?.suggestions ?? [];
    const selectedIndex = suggestionState?.selectedIndex ?? -1;
    const isLoading = suggestionState?.isLoading ?? false;

    // Debounce the query to avoid excessive API calls
    const [debouncedQuery] = useDebounce(query, 300);

    /**
     * Fetches context suggestions based on the query
     */
    const fetchSuggestions = useCallback(
        async (searchQuery: string) => {
            const trimmedQuery = searchQuery.trim();
            if (!trimmedQuery || trimmedQuery.length < 2) {
                dispatch(setSuggestions({ editorId, suggestions: [] }));
                return;
            }

            dispatch(setLoading({ editorId, isLoading: true }));
            try {
                const results = await searchContexts(searchQuery, 10);
                const suggestionItems: ContextSuggestionItem[] = results.map(
                    (ctx) => ({
                        context: ctx.context,
                        label: slugToSentenceCase(ctx.context),
                        count: ctx.count,
                    })
                );
                dispatch(
                    setSuggestions({ editorId, suggestions: suggestionItems })
                );
            } catch (error) {
                console.error("Error fetching context suggestions:", error);
                dispatch(setSuggestions({ editorId, suggestions: [] }));
            } finally {
                dispatch(setLoading({ editorId, isLoading: false }));
            }
        },
        [editorId, dispatch]
    );

    /**
     * Fetch suggestions when debounced query changes
     */
    useEffect(() => {
        fetchSuggestions(debouncedQuery);
    }, [debouncedQuery, fetchSuggestions]);

    /**
     * Handles date selection from the compact date picker
     */
    const handleDateSelect = (date: Date) => {
        const sentenceCase = format(date, "d MMMM yyyy");
        onContextSelect(sentenceCase);
    };

    /**
     * Handles context suggestion click
     */
    const handleSuggestionClick = (suggestion: ContextSuggestionItem) => {
        onContextSelect(suggestion.label);
    };

    /**
     * Renders a single suggestion item
     */
    const renderSuggestionItem = (
        suggestion: ContextSuggestionItem,
        index: number
    ) => {
        const isSelected = index === selectedIndex;
        return (
            <div
                key={suggestion.context}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() =>
                    dispatch(setSelectedIndex({ editorId, index }))
                }
                className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer transition-colors text-sm",
                    isSelected
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                )}
            >
                <span className="truncate">{suggestion.label}</span>
                {suggestion.count !== undefined && (
                    <span
                        className={cn(
                            "ml-2 text-xs rounded-full px-2 py-0.5 font-semibold flex-shrink-0",
                            isSelected
                                ? "bg-accent-foreground/10 text-accent-foreground"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        {suggestion.count}
                    </span>
                )}
            </div>
        );
    };

    const isMobile = deviceType === "mobile";

    return (
        <div
            className={cn(
                "absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-md shadow-lg z-50",
                "flex",
                isMobile ? "flex-col" : "flex-row",
                className
            )}
        >
            {/* Date Picker Section */}
            <div
                className={cn(
                    "p-3",
                    isMobile
                        ? "border-b border-border"
                        : "border-r border-border",
                    isMobile ? "w-full" : "w-64 flex-shrink-0"
                )}
            >
                <CompactDatePicker
                    onDateSelect={handleDateSelect}
                    datesWithNotes={datesWithNotes}
                />
            </div>

            {/* Context Suggestions Section */}
            <div className={cn("flex-1 min-w-0", isMobile ? "" : "")}>
                <div className="p-2">
                    <div className="text-xs font-medium text-muted-foreground px-3 py-2">
                        Context Suggestions
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-4 px-3">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                                <span className="ml-2 text-sm">
                                    Searching...
                                </span>
                            </div>
                        ) : query.trim().length < 2 ? (
                            <div className="py-4 px-3 text-sm text-muted-foreground text-center">
                                Type at least 2 characters to search
                            </div>
                        ) : suggestions.length === 0 ? (
                            <div className="py-4 px-3 text-sm text-muted-foreground text-center">
                                No contexts found
                            </div>
                        ) : (
                            <div>
                                {suggestions.map((suggestion, index) =>
                                    renderSuggestionItem(suggestion, index)
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
