import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AuthButton } from "@/components/auth-button";

export function Nav() {
    return (
        <nav
            className={cn(
                "h-screen fixed left-0 flex flex-col",
                "bg-zinc-100 dark:bg-zinc-800",
                "border-r border-foreground/10",
                "w-12 z-50"
            )}
        >
            <div className="flex flex-col gap-4 justify-center items-center pt-4">
                <ThemeSwitcher />
                <AuthButton />
            </div>
        </nav>
    );
}
