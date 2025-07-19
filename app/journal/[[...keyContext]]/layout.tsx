"use client"; // Must be a client component to use state

import { Menu } from "@/components/menu";
// import { Button } from "@/components/ui/button";
import { PanelLeftOpen } from "lucide-react"; // Renamed X to XIcon to avoid conflict
import { cn } from "@/lib/utils"; // Import cn
import { useViewportHeight } from "@/hooks/use_viewport_height"; // Import the custom hook
import { useAppSelector, useAppDispatch } from "@/store";
import { toggleMenu, setIsMenuOpen } from "@/store/uiSlice";

export default function JournalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const dispatch = useAppDispatch();
    const isMenuOpen = useAppSelector((state) => state.ui.isMenuOpen);
    useViewportHeight(); // Call the hook

    return (
        <>
            {/* Button to toggle menu visibility */}
            <button
                // variant="ghost"
                // size="bigIcon"
                onClick={() => dispatch(toggleMenu())}
                className="fixed top-4 left-4 z-20 text-foreground bg-accent/50 backdrop-blur-md hover:bg-accent p-2 rounded-md" // Adjusted styling
                aria-label="Open menu"
                aria-expanded={isMenuOpen}
                title="Open menu" // Added title for better UX
            >
                <PanelLeftOpen size={22} /> {/* Adjusted icon size */}
            </button>

            <Menu
                isOpen={isMenuOpen}
                onClose={() => dispatch(setIsMenuOpen(false))}
            />

            <main
                className={cn(
                    "flex-1 transition-all duration-300 ease-in-out",
                    {
                        "lg:ml-80": isMenuOpen, // Apply ml-80 (20rem) on lg screens when menu is open
                    }
                )}
            >
                {children}
            </main>
        </>
    );
}
