"use client";

import { useRef, useEffect, useCallback } from "react";
import { Settings2, MessageCircle, ChevronRight } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import { setMenuMode } from "@/store/uiSlice";
import { cn } from "@/lib/utils";
import { HathiIcon } from "../icon";
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
        // Reset to chat menu when closing for better UX
        if (menuMode !== "chat") {
            dispatch(setMenuMode("chat"));
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
                    "transition-transform duration-300 ease-in-out border-l border-zinc-300/50 dark:border-zinc-600/50 w-full sm:w-1/2 lg:w-[40vw] z-[100]",
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
                            <button
                                onClick={() =>
                                    dispatch(
                                        setMenuMode(
                                            menuMode === "preferences"
                                                ? "chat"
                                                : "preferences"
                                        )
                                    )
                                }
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                                    "transition-colors duration-150",
                                    "text-xs font-medium",
                                    "bg-gray-200/50 dark:bg-gray-800/50 text-foreground/70 hover:bg-gray-300/70 dark:hover:bg-gray-700/70 hover:text-foreground"
                                )}
                                aria-label={
                                    menuMode === "preferences"
                                        ? "Back to Chat"
                                        : "Settings"
                                }
                            >
                                {menuMode === "preferences" ? (
                                    <>
                                        <MessageCircle size={14} />
                                        <span>Chat</span>
                                    </>
                                ) : (
                                    <>
                                        <Settings2 size={14} />
                                        <span>Settings</span>
                                    </>
                                )}
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
                        {menuMode === "chat" ? (
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
