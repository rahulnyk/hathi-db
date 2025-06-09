"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AuthButton } from "@/components/auth-button";

export function Nav() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Hamburger Menu Button */}
            <button
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="main-nav"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={cn(
                    "fixed top-4 left-4 z-50 p-2 rounded-md",
                    "bg-zinc-200 dark:bg-zinc-700 text-foreground",
                    "md:hidden" // Only show on mobile
                )}
            >
                {isMobileMenuOpen ? (
                    // X icon for close
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    // Hamburger icon
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                )}
            </button>

            <nav
                id="main-nav"
                className={cn(
                    "fixed top-0 left-0 h-screen flex flex-col",
                    "bg-zinc-100 dark:bg-zinc-800",
                    "border-r border-foreground/10",
                    "w-64 z-40", // Width for both mobile (when open) and desktop
                    "transition-transform duration-300 ease-in-out",
                    // Mobile: initially hidden, slides in
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
                    // Desktop: always visible and correctly positioned
                    "md:translate-x-0 md:flex"
                )}
            >
                <div className="flex flex-col gap-4 justify-center items-center pt-16 md:pt-4"> {/* Added padding top for mobile to not overlap hamburger */}
                    <ThemeSwitcher />
                    <AuthButton />
                    {/* TODO: Add NavLink components here */}
                </div>
            </nav>
        </>
    );
}
