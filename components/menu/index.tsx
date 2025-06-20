"use client";

// useState and useEffect removed as isDatePickerOpen state is removed
// Button import removed as child components (ThemeSwitcher, LogoutButton) import it themselves.
// CalendarIcon import removed
// import { Button } from "@/components/ui/button"; // Import Button
import { PanelLeftClose } from "lucide-react"; // Import XIcon
import { ThemeSwitcher } from "../theme-switcher";
import { LogoutButton } from "../logout-button";
import { DateContextPicker } from "../journal/date_context_picker";
import { ContextList } from "./context-list"; // Import ContextList component
// Unused imports related to dispatch and dateToSlug are now fully removed.
import { cn } from "@/lib/utils";
import { ElephantIcon } from "../icon";

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
                "flex flex-col", // Added flex flex-col
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
        >
            <div className="flex items-center justify-between pt-2 pr-4 pl-6 border-b border-border/20">
                <div className="flex flex-row items-center space-x-2 text-foreground/50">
                    <ElephantIcon size={40} />
                    <span className="text-xl font-bold">hathi</span>
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
                <div className="flex flex-row items-center justify-around p-2 border-t border-border/20 mt-auto gap-2">
                    <ThemeSwitcher isExpanded={true} />
                    <LogoutButton isExpanded={true} />
                </div>
            </div>
        </div>
    );
}
