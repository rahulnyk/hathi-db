"use client";

// useState and useEffect removed as isDatePickerOpen state is removed
// Button import removed as child components (ThemeSwitcher, LogoutButton) import it themselves.
// CalendarIcon import removed
// import { Button } from "@/components/ui/button"; // Import Button
import { PanelLeftClose } from "lucide-react"; // Import XIcon
import { ThemeSwitcher } from "../theme-switcher";
import { LogoutButton } from "../logout-button";
import { DateContextPicker } from "../journal/date_context_picker";
import { ContextList } from "./ContextList"; // Import ContextList component
// Unused imports related to dispatch and dateToSlug are now fully removed.
import { cn } from "@/lib/utils";

interface RetractableMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Menu({ isOpen, onClose }: RetractableMenuProps) {
    // isDatePickerOpen state and related useEffect/handleCalendarButtonClick removed

    // if (!isOpen) return null; // Using translate-x for animation, so always render

    return (
        <div
            className={cn(
                "fixed top-0 left-0 h-[calc(var(--dynamic-vh,1vh)*100)] bg-zinc-200 dark:bg-zinc-800 text-foreground",
                "transition-transform duration-300 ease-in-out shadow-lg border-r border-border/20 w-80 z-[100]",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
        >
            <button
                onClick={onClose}
                className="fixed top-4 right-4 z-20 text-foreground hover:bg-accent p-2 rounded-md" // Adjusted styling
                aria-label="Open menu"
                title="Open menu" // Added title for better UX
            >
                <PanelLeftClose size={22} /> {/* Adjusted icon size */}
            </button>

            <div className="flex flex-col h-full pt-10">
                <div className="flex-grow overflow-y-auto px-4 space-y-2">
                    <div className="p-1 rounded-md flex justify-center">
                        <DateContextPicker
                            isOpen={true} // DateContextPicker is always "open" when RetractableMenu is
                            onDateChangeHook={() => {
                                // After a date is selected, close the main menu.
                                onClose();
                            }}
                        />
                    </div>
                    <ContextList />
                </div>
                {/* <div className="flex-grow overflow-y-auto border-t border-neutral-200 dark:border-neutral-800 mt-2 pt-2">
                    
                </div> */}

                {/* Sticky Bottom Group - always rendered in "expanded" form because menu is either open or not rendered */}
                <div className="p-3 border-t border-border/20 mt-auto">
                    <ThemeSwitcher isExpanded={true} />
                    <LogoutButton isExpanded={true} />
                </div>
            </div>
        </div>
    );
}
