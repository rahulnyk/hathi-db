"use client";

import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNavManager({ children }: { children: ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Hamburger Button (remains mostly the same) */}
            <button
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="main-nav-panel" // This ID now refers to the div below
                className={cn(
                    "md:hidden fixed top-4 left-3 z-[51] p-2 rounded-full", // z-[51] to be above nav panel (z-50)
                    "text-foreground bg-background/80 backdrop-blur-sm hover:bg-muted"
                )}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Mobile Nav Panel (rendered by MobileNavManager) */}
            <div
                id="main-nav-panel" // ID for ARIA
                className={cn(
                    "md:hidden fixed top-0 left-0 h-screen w-14 z-50",
                    // "border-r border-foreground/10", // Border for the panel
                    "transform transition-transform duration-300 ease-in-out",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    // Background is now part of the Nav component rendered as children
                )}
            >
                {children} {/* Nav component is rendered inside this panel */}
            </div>

            {/* Desktop Nav Container (static) */}
            <div
                className={cn(
                    "hidden md:block fixed top-0 left-0 h-screen w-14 z-50"
                    // "border-r border-foreground/10" // Border for the panel
                    // Background is now part of the Nav component rendered as children
                )}
            >
                {children}{" "}
                {/* Nav component is rendered inside this static container */}
            </div>
        </>
    );
}
