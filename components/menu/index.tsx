"use client";

import { useRef, useEffect, useCallback } from "react";
import {
    Settings2,
    LayoutList,
    MessageCircle,
    ChevronRight,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import { setMenuMode } from "@/store/uiSlice";
import { cn } from "@/lib/utils";
import { HathiIcon } from "../icon";
import { ContextMenu } from "./context-menu";
import { PreferencesMenu } from "./preferences-menu";
import { ChatMenu } from "./chat-menu";
import { TooltipProvider } from "@/components/ui/tooltip";

interface RetractableMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Menu({ isOpen, onClose }: RetractableMenuProps) {
    const dispatch = useAppDispatch();
    const deviceType = useAppSelector((state) => state.ui.deviceType);
    const menuMode = useAppSelector((state) => state.ui.menuMode);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleClose = useCallback(() => {
        // Reset to context menu when closing for better UX
        // This ensures the menu always opens to the context view
        if (menuMode !== "context") {
            dispatch(setMenuMode("context"));
        }
        onClose();
    }, [menuMode, dispatch, onClose]);

    // useEffect for click outside functionality
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                deviceType === "mobile" &&
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, handleClose, deviceType]);

    return (
        <TooltipProvider delayDuration={300}>
            <div
                ref={menuRef}
                className={cn(
                    "fixed top-0 right-0 h-[calc(var(--dynamic-vh,1vh)*100)] bg-zinc-200 dark:bg-zinc-800 text-foreground",
                    "transition-transform duration-300 ease-in-out border-l border-zinc-300/50 dark:border-zinc-700/50 w-full sm:w-1/2 lg:w-[33vw] z-[100]",
                    "flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between pt-4 pr-4 pl-6 pb-3 border-b border-border/20">
                    <div className="flex flex-row items-center gap-3">
                        <HathiIcon
                            size={26}
                            aria-hidden="true"
                            strokeWidth={10}
                            className="text-foreground"
                        />
                        <span className="text-xl font-semibold text-foreground">
                            hathi
                        </span>

                        {/* Navigation Buttons */}
                        <div className="flex items-center gap-1 ml-2">
                            {/* Settings Button - Pill Style */}
                            <button
                                onClick={() =>
                                    dispatch(setMenuMode("preferences"))
                                }
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                                    "transition-colors duration-150",
                                    "text-xs font-medium",
                                    menuMode === "preferences"
                                        ? "bg-gray-300 dark:bg-gray-700 text-foreground"
                                        : "bg-gray-200/50 dark:bg-gray-800/50 text-foreground/70 hover:bg-gray-300/70 dark:hover:bg-gray-700/70 hover:text-foreground"
                                )}
                                aria-label="Preferences menu"
                            >
                                <Settings2 size={14} />
                                <span>Settings</span>
                            </button>

                            {/* Context Button - Pill Style */}
                            <button
                                onClick={() => dispatch(setMenuMode("context"))}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                                    "transition-colors duration-150",
                                    "text-xs font-medium",
                                    menuMode === "context"
                                        ? "bg-gray-300 dark:bg-gray-700 text-foreground"
                                        : "bg-gray-200/50 dark:bg-gray-800/50 text-foreground/70 hover:bg-gray-300/70 dark:hover:bg-gray-700/70 hover:text-foreground"
                                )}
                                aria-label="Context menu"
                            >
                                <LayoutList size={14} />
                                <span>Context</span>
                            </button>

                            {/* Chat Button - Pill Style */}
                            <button
                                onClick={() => dispatch(setMenuMode("chat"))}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                                    "transition-colors duration-150",
                                    "text-xs font-medium",
                                    menuMode === "chat"
                                        ? "bg-gray-300 dark:bg-gray-700 text-foreground"
                                        : "bg-gray-200/50 dark:bg-gray-800/50 text-foreground/70 hover:bg-gray-300/70 dark:hover:bg-gray-700/70 hover:text-foreground"
                                )}
                                aria-label="Chat menu"
                            >
                                <MessageCircle size={14} />
                                <span>Chat</span>
                            </button>
                        </div>
                    </div>

                    {/* Close button - visible only on smaller screens where menu overlays */}
                    <button
                        onClick={handleClose}
                        className="lg:hidden flex items-center p-2 rounded-full transition-colors duration-150 bg-gray-200/50 dark:bg-gray-800/50 text-foreground/70 hover:bg-gray-300/70 dark:hover:bg-gray-700/70 hover:text-foreground"
                        aria-label="Close menu"
                        title="Close menu"
                    >
                        <ChevronRight size={22} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex flex-col flex-1 min-h-0 pt-2">
                    <div className="flex-grow overflow-y-auto px-2 space-y-2">
                        {menuMode === "context" ? (
                            <ContextMenu onCloseMenu={onClose} />
                        ) : menuMode === "chat" ? (
                            <ChatMenu />
                        ) : (
                            <PreferencesMenu />
                        )}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
