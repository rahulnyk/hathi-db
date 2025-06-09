import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AuthButton } from "@/components/auth-button";

export function Nav() {
    return (
        <nav
            id="main-nav-panel" // ID for aria-controls
            className={cn(
                "fixed top-0 left-0 h-screen w-64 z-50", // Positioning, sizing, z-index
                "bg-zinc-100 dark:bg-zinc-800", // Background styling
                "border-r border-foreground/10", // Border styling
                "flex flex-col", // Internal content layout
                "transform transition-transform duration-300 ease-in-out", // Animation properties
                "-translate-x-full", // Default state: hidden on mobile (slides out to the left)
                "md:translate-x-0" // Default state: visible on md screens and up (slides in)
            )}
        >
            <div className="flex flex-col gap-4 justify-center items-center pt-16 md:pt-4"> {/* Adjusted padding for mobile */}
                <ThemeSwitcher />
                <AuthButton />
                {/* TODO: Add NavLink components here */}
            </div>
        </nav>
    );
}
