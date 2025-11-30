"use client";

import { useRef, useEffect, useCallback } from "react";
import { PanelLeftClose, Settings2, LayoutList, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useAppSelector, useAppDispatch } from "@/store";
import { toggleMenuMode } from "@/store/uiSlice";
import { cn } from "@/lib/utils";
import { HathiIcon } from "../icon";
import { ContextMenu } from "./context-menu";
import { PreferencesMenu } from "./preferences-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface RetractableMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Menu({ isOpen, onClose }: RetractableMenuProps) {
    const dispatch = useAppDispatch();
    const { theme, setTheme } = useTheme();
    const deviceType = useAppSelector((state) => state.ui.deviceType);
    const menuMode = useAppSelector((state) => state.ui.menuMode);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleClose = useCallback(() => {
        // Reset to context menu when closing for better UX
        // This ensures the menu always opens to the context view
        if (menuMode === "preferences") {
            dispatch(toggleMenuMode());
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

    const handleToggleMenuMode = () => {
        dispatch(toggleMenuMode());
    };

    const handleToggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    const isCurrentlyDark = theme === "dark";
    const ThemeIcon = isCurrentlyDark ? Sun : Moon;
    const MenuModeIcon = menuMode === "context" ? Settings2 : LayoutList;

    return (
        <TooltipProvider delayDuration={300}>
            <div
                ref={menuRef}
                className={cn(
                    "fixed top-0 left-0 h-[calc(var(--dynamic-vh,1vh)*100)] bg-zinc-200 dark:bg-zinc-800 text-foreground",
                    "transition-transform duration-300 ease-in-out border-r border-border/20 w-80 z-[100]",
                    "flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
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

                        {/* Theme and Preferences Buttons */}
                        <div className="flex items-center gap-1 ml-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={handleToggleTheme}
                                        className={cn(
                                            "p-1.5 rounded-md text-foreground/70",
                                            "hover:bg-gray-300/50 dark:hover:bg-gray-700/50",
                                            "hover:text-foreground",
                                            "transition-colors duration-150"
                                        )}
                                        aria-label={`Switch to ${isCurrentlyDark ? "light" : "dark"} mode`}
                                    >
                                        <ThemeIcon size={16} />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p>
                                        {isCurrentlyDark
                                            ? "Light mode"
                                            : "Dark mode"}
                                    </p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={handleToggleMenuMode}
                                        className={cn(
                                            "p-1.5 rounded-md text-foreground/70",
                                            "hover:bg-gray-300/50 dark:hover:bg-gray-700/50",
                                            "hover:text-foreground",
                                            "transition-colors duration-150"
                                        )}
                                        aria-label={
                                            menuMode === "context"
                                                ? "Open preferences"
                                                : "Back to contexts"
                                        }
                                    >
                                        <MenuModeIcon size={16} />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p>
                                        {menuMode === "context"
                                            ? "Preferences"
                                            : "Contexts"}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        className="text-foreground hover:bg-accent p-1 rounded-md"
                        aria-label="Close menu"
                        title="Close menu"
                    >
                        <PanelLeftClose size={22} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex flex-col flex-1 min-h-0 pt-2">
                    <div className="flex-grow overflow-y-auto px-2 space-y-2">
                        {menuMode === "context" ? (
                            <ContextMenu onCloseMenu={onClose} />
                        ) : (
                            <PreferencesMenu />
                        )}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
