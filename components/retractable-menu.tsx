"use client";

// useState and useEffect removed as isDatePickerOpen state is removed
// Button import removed as child components (ThemeSwitcher, LogoutButton) import it themselves.
// CalendarIcon import removed
import { ThemeSwitcher } from "./theme-switcher";
import { LogoutButton } from "./logout-button";
import { DateContextPicker } from "./journal/date_context_picker";

// Unused imports related to dispatch and dateToSlug are now fully removed.
import { cn } from "@/lib/utils";

interface RetractableMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RetractableMenu({ isOpen, onClose }: RetractableMenuProps) {
    // isDatePickerOpen state and related useEffect/handleCalendarButtonClick removed

    // if (!isOpen) return null; // Using translate-x for animation, so always render

    return (
        <div
            className={cn(
                "fixed top-0 left-0 h-screen bg-zinc-200 dark:bg-zinc-800 text-foreground transition-transform duration-300 ease-in-out shadow-lg border-r border-border/20 w-80 z-[100]", // z-index 100. Changed bg-zinc-100 to bg-zinc-200 and dark:bg-zinc-900 to dark:bg-zinc-800
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
        >
            {/* Increased top padding from pt-4 to pt-16 (4rem) */}
            <div className="flex flex-col h-full pt-16">
                {/* Scrollable Area - always rendered when menu itself is open */}
                {/* Removed pt-0 from here, padding is now on parent */}
                <div className="flex-grow overflow-y-auto px-4 space-y-2">
                    {/* Home Button Removed */}
                    {/* Calendar Button Removed */}

                    {/* DateContextPicker is now always rendered when menu is open */}
                    <div className="p-1 rounded-md flex justify-center">
                        <DateContextPicker
                            isOpen={true} // DateContextPicker is always "open" when RetractableMenu is
                            onDateChangeHook={() => {
                                // After a date is selected, close the main menu.
                                onClose();
                            }}
                        />
                    </div>
                </div>

                {/* Sticky Bottom Group - always rendered in "expanded" form because menu is either open or not rendered */}
                <div className="p-3 border-t border-border/20 mt-auto">
                    <ThemeSwitcher isExpanded={true} />
                    <LogoutButton isExpanded={true} />
                </div>
            </div>
        </div>
    );
}
