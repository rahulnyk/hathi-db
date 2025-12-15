"use client";

import { useState } from "react";
import {
    cn,
    slugToSentenceCase,
    isValidDateSlug,
    sentenceCaseToSlug,
} from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/store";
import { toggleMenu } from "@/store/uiSlice";
import { setCurrentContext } from "@/store/notesSlice";
import { fetchContextsPaginated } from "@/store/notesMetadataSlice";
import {
    Target,
    Calendar,
    ChevronLeft,
    ChevronRight,
    PencilLine,
    Check,
    X,
    Loader2,
} from "lucide-react";
import { useContextNavigation } from "@/lib/context-navigation";
import { renameContext, checkContextExists } from "@/app/actions/contexts";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ContextMenuModal } from "./context-menu-modal";

export function NotesPanelHeader() {
    const dispatch = useAppDispatch();
    const { navigateToContext } = useContextNavigation();
    const { currentContext } = useAppSelector((state) => state.notes);
    const { todayContext, isMenuOpen } = useAppSelector((state) => state.ui);
    const todaysDateSlug = todayContext;

    // State for edit mode
    const [isEditing, setIsEditing] = useState(false);
    const [isContextPopoverOpen, setIsContextPopoverOpen] = useState(false);
    const [editValue, setEditValue] = useState("");
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameError, setRenameError] = useState<string | null>(null);

    const showHomeButton = currentContext !== todaysDateSlug;
    // Don't allow editing date contexts
    const canEditContext = !isValidDateSlug(currentContext);

    const handleGoToToday = () => {
        // Use context navigation hook to properly navigate to today
        navigateToContext(todaysDateSlug);
    };

    const handleEditClick = () => {
        setIsEditing(true);
        setEditValue(slugToSentenceCase(currentContext));
        setRenameError(null);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditValue("");
        setRenameError(null);
    };

    const handleSaveEdit = async () => {
        const newName = editValue.trim();
        if (!newName) {
            setRenameError("Context name cannot be empty");
            return;
        }

        const newSlug = sentenceCaseToSlug(newName);
        if (newSlug === currentContext) {
            setIsEditing(false);
            setEditValue("");
            return;
        }

        setIsRenaming(true);
        setRenameError(null);

        try {
            // Check if context exists
            const exists = await checkContextExists(newSlug);

            if (exists) {
                const confirmed = window.confirm(
                    `Context "${slugToSentenceCase(
                        newSlug
                    )}" already exists.\n\nDo you want to merge "${slugToSentenceCase(
                        currentContext
                    )}" into it?\n\nThis will move all notes to the new context and delete "${slugToSentenceCase(
                        currentContext
                    )}".`
                );

                if (!confirmed) {
                    setIsRenaming(false);
                    return;
                }
            }

            await renameContext(currentContext, newSlug);

            // Update current context and navigate to new context
            dispatch(setCurrentContext(newSlug));
            navigateToContext(newSlug);

            // Refresh the context list
            dispatch(fetchContextsPaginated({ reset: true }));

            setIsEditing(false);
            setEditValue("");
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to rename context";
            setRenameError(errorMessage);
        } finally {
            setIsRenaming(false);
        }
    };

    return (
        <div
            className={cn(
                "w-full sticky top-0 z-10 py-2",
                "bg-background",
                "h-14", // Set height
                "border-b border-border"
            )}
        >
            <div
                className={cn(
                    "flex flex-row justify-between items-center gap-4 h-full",
                    "px-4 py-2 group"
                )}
            >
                {/* Context title */}
                <div
                    className={cn(
                        "flex flex-row items-center gap-4 min-w-0 max-w-[50vw] md:px-5 py-4",
                        "accent-font"
                    )}
                >
                    <Target size={22} className="hidden md:block" />
                    {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 min-w-0 px-2 py-1 text-lg rounded border border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleSaveEdit();
                                    } else if (e.key === "Escape") {
                                        e.preventDefault();
                                        handleCancelEdit();
                                    }
                                }}
                            />
                            <button
                                onClick={handleSaveEdit}
                                disabled={isRenaming}
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                title="Save"
                            >
                                {isRenaming ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                                )}
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                disabled={isRenaming}
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                title="Cancel"
                            >
                                <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </button>
                            {renameError && (
                                <span className="text-xs text-red-500 ml-2">
                                    {renameError}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 min-w-0 group/title">
                            <Popover
                                open={isContextPopoverOpen}
                                onOpenChange={setIsContextPopoverOpen}
                            >
                                <PopoverTrigger asChild>
                                    <h2
                                        className={cn(
                                            "text-2xl",
                                            "truncate text-left cursor-pointer hover:underline decoration-dotted underline-offset-4",
                                            "hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                        )}
                                    >
                                        {slugToSentenceCase(currentContext)}
                                    </h2>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-[90vw] md:w-[700px] p-0 z-50"
                                    align="start"
                                    sideOffset={10}
                                >
                                    <ContextMenuModal
                                        onClose={() =>
                                            setIsContextPopoverOpen(false)
                                        }
                                    />
                                </PopoverContent>
                            </Popover>
                            {canEditContext && (
                                <button
                                    onClick={handleEditClick}
                                    className={cn(
                                        "hover:bg-accent p-1 rounded-full transition-colors size-8 justify-center items-center flex"
                                    )}
                                    title="Edit context name"
                                >
                                    <PencilLine size={20} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Right side buttons group */}
                <div className="flex items-center gap-2">
                    {/* Today button */}
                    <button
                        onClick={showHomeButton ? handleGoToToday : undefined}
                        disabled={!showHomeButton}
                        className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 border text-xs",
                            showHomeButton
                                ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 button-font-secondary cursor-pointer"
                                : "bg-teal-50/50 dark:bg-teal-900/20 text-teal-600/70 dark:text-teal-400/70 border-teal-100/50 dark:border-teal-800/30 cursor-default"
                        )}
                        title={
                            showHomeButton ? "Go to Today's Journal" : "Today"
                        }
                    >
                        <Calendar size={12} />
                        <span
                            className={cn(
                                "hidden sm:inline",
                                !showHomeButton &&
                                    "uppercase text-[10px] tracking-wider font-medium"
                            )}
                        >
                            Today
                        </span>
                    </button>

                    {/* Menu toggle button */}
                    <button
                        onClick={() => dispatch(toggleMenu())}
                        className={cn(
                            "hover:bg-accent p-1 rounded-full transition-colors size-8 justify-center items-center flex"
                        )}
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isMenuOpen}
                        title={isMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {isMenuOpen ? (
                            <ChevronRight size={22} />
                        ) : (
                            <ChevronLeft size={22} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
