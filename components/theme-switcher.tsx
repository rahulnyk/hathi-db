"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
// import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react"; // Keep useEffect and useState for mounted check

interface ThemeSwitcherProps {
    isExpanded?: boolean;
}

export function ThemeSwitcher({ isExpanded = true }: ThemeSwitcherProps) {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // To prevent hydration mismatch, button logic relies on theme, which is client-side
        // Render a placeholder or null until mounted
        if (isExpanded) {
            return (
                <button
                    disabled
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full",
                        "bg-gray-200 dark:bg-gray-700",
                        "border border-gray-300 dark:border-gray-600",
                        "button-font-secondary",
                        "opacity-50 cursor-not-allowed"
                    )}
                >
                    <Sun size={14} />
                    <span className="hidden sm:inline">Loading...</span>
                </button>
            );
        }
        return (
            <button
                disabled
                className={cn(
                    "flex items-center px-1.5 py-1.5 rounded-full",
                    "bg-gray-200 dark:bg-gray-700",
                    "border border-gray-300 dark:border-gray-600",
                    "button-font-secondary",
                    "opacity-50 cursor-not-allowed"
                )}
            >
                <Sun size={14} />
            </button>
        );
    }

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    // Text and icon for the button should indicate the theme it will switch TO
    const isCurrentlyDark = theme === "dark";
    const targetThemeText = isCurrentlyDark ? "Light Mode" : "Dark Mode";
    const TargetIcon = isCurrentlyDark ? Sun : Moon;

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full",
                "bg-gray-200 dark:bg-gray-700",
                "border border-gray-300 dark:border-gray-600",
                "hover:bg-gray-300 dark:hover:bg-gray-600",
                "transition-all duration-200",
                "button-font-secondary",
                !isExpanded && "px-1.5" // Adjust padding for icon-only mode
            )}
            aria-label={`Switch to ${targetThemeText.toLowerCase()}`}
        >
            <TargetIcon size={14} />
            {isExpanded && (
                <span className="hidden sm:inline">{targetThemeText}</span>
            )}
        </button>
    );
}

// Re-exporting with a different name to avoid conflict if old ThemeSwitcher was named differently,
// but the prompt uses 'ThemeSwitcher' for the component name.
// For clarity, ensure the export name is consistent.
// export { ThemeSwitcher };
