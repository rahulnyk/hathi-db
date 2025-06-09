"use client";

import React, { useState, Children, cloneElement, isValidElement, ReactElement } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Define an interface for the expected props of the child Nav component
// This helps ensure MobileNavManager interacts correctly with Nav.
interface NavComponentProps {
    className?: string;
    id?: string;
    // Add any other props that Nav might have and MobileNavManager might need to interact with,
    // though primarily className and id are relevant here.
}

export function MobileNavManager({ children }: { children: ReactElement<NavComponentProps> }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Ensure 'children' is a single, valid React element (the Nav component).
    const navChild = Children.only(children);

    if (!isValidElement(navChild)) {
        // In a real app, you might throw an error or return a fallback UI.
        console.error("MobileNavManager expects a single valid ReactElement child (the Nav component).");
        return null;
    }

    // Determine the ID for ARIA attributes. Prefer the ID from the Nav component itself.
    // Fallback to "main-nav-panel" if Nav doesn't provide an ID.
    const navId = navChild.props.id || "main-nav-panel";

    return (
        <>
            {/* Hamburger Menu Button */}
            <button
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls={navId} // Links to the Nav panel via its ID
                className={cn(
                    "md:hidden fixed top-4 left-4 z-[51] p-2 rounded-md", // z-[51] to be above nav panel (z-50)
                    "text-foreground bg-background/80 backdrop-blur-sm hover:bg-muted" // Basic styling
                )}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Clone the Nav component (passed as children) and apply dynamic classes */}
            {/* The original Nav component should have its own base classes for:
                - Fixed positioning (fixed, top-0, left-0, h-screen, z-50)
                - Styling (background, border, width like w-64)
                - Initial transform state for mobile (e.g., "-translate-x-full")
                - Transform state for desktop (e.g., "md:translate-x-0")
                - Transition classes (e.g., "transition-transform duration-300 ease-in-out")
            */}
            {cloneElement(navChild, {
                // Merge existing className from Nav with dynamic classes from MobileNavManager
                className: cn(
                    navChild.props.className, // Keep original classes from Nav
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full", // On mobile, toggle based on state
                    "md:translate-x-0" // On desktop, ensure it's visible (overrides mobile's -translate-x-full)
                ),
                // Ensure the Nav component has an id for aria-controls.
                // If navChild.props.id was undefined, this assigns the determined navId.
                id: navId
            })}
        </>
    );
}
