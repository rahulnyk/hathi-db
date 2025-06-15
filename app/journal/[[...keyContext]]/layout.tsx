"use client"; // Must be a client component to use state

import { useState } from "react";
import { RetractableMenu } from "@/components/retractable-menu";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen, X as XIcon } from "lucide-react"; // Renamed X to XIcon to avoid conflict
import { cn } from "@/lib/utils"; // Import cn

export default function JournalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            {/* Button to toggle menu visibility */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="fixed top-4 left-4 z-[101] bg-background/80 backdrop-blur-sm text-foreground hover:bg-muted p-2 rounded-full" // Adjusted styling
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                title={isMenuOpen ? "Close menu" : "Open menu"} // Added title for better UX
            >
                {isMenuOpen ? <XIcon size={22} /> : <PanelLeftOpen size={22} />} {/* Adjusted icon size */}
            </Button>

            <RetractableMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            <main className={cn(
                "flex-1 bg-zinc-50 dark:bg-zinc-900 transition-all duration-300 ease-in-out",
                {
                    "lg:ml-80": isMenuOpen, // Apply ml-80 (20rem) on lg screens when menu is open
                }
            )}>
                {children}
            </main>
        </>
    );
}
