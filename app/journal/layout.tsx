"use client"; // Must be a client component to use state

import { Menu } from "@/components/menu";
import { PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useViewportHeight } from "@/hooks/use_viewport_height";
import { useAppSelector, useAppDispatch } from "@/store";
import { toggleMenu, setIsMenuOpen } from "@/store/uiSlice";
import { ChatProvider } from "@/lib/chat-context";

export default function JournalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const dispatch = useAppDispatch();
    const isMenuOpen = useAppSelector((state) => state.ui.isMenuOpen);
    useViewportHeight(); // Call the hook

    return (
        <ChatProvider>
            {/* Button to toggle menu visibility */}
            <button
                onClick={() => dispatch(toggleMenu())}
                className="fixed top-4 left-4 z-20 text-foreground bg-accent/50 backdrop-blur-md hover:bg-accent p-2 rounded-md"
                aria-label="Open menu"
                aria-expanded={isMenuOpen}
                title="Open menu"
            >
                <PanelLeftOpen size={22} />
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
        </ChatProvider>
    );
}
