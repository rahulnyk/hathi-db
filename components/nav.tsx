import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "./theme-switcher";
import { AuthButton } from "./auth-button";
export function Nav() {
    return (
        <nav
            // ID removed, will be on the panel rendered by MobileNavManager
            className={cn(
                "w-full h-full", // Take full width/height of its container
                "flex flex-col items-center gap-4 pt-16", // Internal layout
                "bg-zinc-100/50 dark:bg-zinc-800/50", // Background is part of Nav itself
                "backdrop-blur-lg"
            )}
        >
            <ThemeSwitcher />
            <AuthButton />
        </nav>
    );
}
