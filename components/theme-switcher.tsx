"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
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
                <Button
                    variant="ghost"
                    size="default"
                    disabled
                    className="flex items-center justify-center gap-2 text-base py-2 hover:bg-muted w-full"
                >
                    <Sun className="h-5 w-5 mr-0" />
                    <span>Loading Theme...</span>
                </Button>
            );
        }
        return (
            <Button
                variant="ghost"
                size="icon"
                disabled
                className="h-12 w-12 justify-center"
            >
                <Sun className="h-5 w-5" />
            </Button>
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
        <Button
            variant="ghost"
            size={isExpanded ? "default" : "icon"}
            onClick={toggleTheme}
            className={cn(
                "text-base hover:bg-muted", // Common classes
                isExpanded
                    ? "flex items-center justify-center gap-2 py-2" // Expanded: full width, justify start, specific padding
                    : "h-12 w-12 justify-center" // Collapsed: fixed size, justify center
            )}
            aria-label={`Switch to ${targetThemeText.toLowerCase()}`}
        >
            <TargetIcon className={cn("h-5 w-5", isExpanded && "mr-0")} />
            {isExpanded && <span>{targetThemeText}</span>}
        </Button>
    );
}

// Re-exporting with a different name to avoid conflict if old ThemeSwitcher was named differently,
// but the prompt uses 'ThemeSwitcher' for the component name.
// For clarity, ensure the export name is consistent.
// export { ThemeSwitcher };
