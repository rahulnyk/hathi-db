"use client";

import { useRef, useEffect } from "react"; // Import useRef and useEffect
import { PanelLeftClose } from "lucide-react"; // Import XIcon
import { useAppSelector, useAppDispatch } from "@/store"; // Import useAppSelector and useAppDispatch
import { clearDatePickerSelection } from "@/store/uiSlice";
import { ThemeSwitcher } from "../theme-switcher";
import { DateContextPicker } from "../journal/date_context_picker";
import { ContextList } from "./context-list"; // Import ContextList component
import { ContextSearchBox } from "../ui/context-search-box";
import { cn } from "@/lib/utils";
import { HathiIcon } from "../icon";
import { useContextNavigation } from "@/lib/context-navigation";

interface RetractableMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Menu({ isOpen, onClose }: RetractableMenuProps) {
    const dispatch = useAppDispatch();
    const { navigateToContext } = useContextNavigation();
    const deviceType = useAppSelector((state) => state.ui.deviceType); // Get deviceType from Redux store
    const menuRef = useRef<HTMLDivElement>(null); // Create menuRef

    // useEffect for click outside functionality
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                deviceType === "mobile" && // Check if deviceType is "mobile"
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose, deviceType]); // Add isOpen, onClose, and deviceType to dependency array

    return (
        <div
            ref={menuRef} // Assign menuRef to the main div
            className={cn(
                "fixed top-0 left-0 h-[calc(var(--dynamic-vh,1vh)*100)] bg-zinc-200 dark:bg-zinc-800 text-foreground",
                "transition-transform duration-300 ease-in-out border-r border-border/20 w-80 z-[100]",
                "flex flex-col", // Added flex flex-col
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
        >
            <div className="flex items-baseline justify-between pt-4 pr-4 pl-6 border-b border-border/20">
                <div className="flex flex-row items-center space-x-2 text-foreground/50">
                    <HathiIcon
                        size={26}
                        aria-hidden="true"
                        strokeWidth={10}
                        className="text-foreground"
                    />
                    <span className="text-xl font-semibold align-bottom text-foreground">
                        hathi
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="text-foreground hover:bg-accent p-1 rounded-md"
                    aria-label="Close menu"
                    title="Close menu"
                >
                    <PanelLeftClose size={22} /> {/* Adjusted icon size */}
                </button>
            </div>

            <div className="flex flex-col flex-1 min-h-0 pt-2">
                {/* Added min-h-0 */}
                <div className="flex-grow overflow-y-auto px-2 space-y-2">
                    {/* Added overflow-y-auto */}
                    <div className="p-0 rounded-md flex justify-center">
                        <DateContextPicker
                            isOpen={true} // DateContextPicker is always "open" when RetractableMenu is
                            onDateChangeHook={() => {
                                // After a date is selected, close the main menu if on mobile.
                                if (deviceType === "mobile") {
                                    onClose();
                                }
                            }}
                        />
                    </div>

                    {/* Divider between date picker and context search */}
                    {/* <div className="flex justify-center px-2">
                        <div className="h-px bg-zinc-300/50 dark:bg-zinc-600/50 w-full"></div>
                    </div> */}

                    {/* Context Search Box */}
                    <div className="px-2">
                        <ContextSearchBox
                            placeholder="Search contexts..."
                            className="[&_input]:shadow-none"
                            onContextSelect={(context) => {
                                // Clear the date picker selection when selecting a context via search
                                // This ensures mutual exclusivity between date and context selection
                                dispatch(clearDatePickerSelection());

                                // Use context navigation hook to properly exit chat mode and preserve chat history
                                navigateToContext(context);
                                if (deviceType === "mobile") {
                                    onClose();
                                }
                            }}
                        />
                    </div>

                    {/* Divider between context search and context list */}
                    {/* <div className="flex justify-center px-6">
                        <div className="h-px bg-zinc-300 dark:bg-zinc-600 w-full"></div>
                    </div> */}

                    <ContextList
                        onCloseMenu={onClose}
                        deviceType={deviceType}
                    />
                </div>

                {/* Sticky Bottom Group - always rendered in "expanded" form because menu is either open or not rendered */}
                <div className="flex flex-row items-center justify-around p-2 border-t border-border/20 mt-auto gap-2">
                    <ThemeSwitcher isExpanded={true} />
                </div>
            </div>
        </div>
    );
}
