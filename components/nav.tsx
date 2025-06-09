import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Palette, UserCircle2 } from "lucide-react"; // Assuming these are the chosen icons

export function Nav() {
    return (
        <nav
            // ID removed, will be on the panel rendered by MobileNavManager
            className={cn(
                "w-full h-full", // Take full width/height of its container
                "flex flex-col items-center gap-4 pt-4", // Internal layout
                "bg-zinc-100 dark:bg-zinc-800" // Background is part of Nav itself
            )}
        >
            <TooltipProvider>
                {/* Grouping Tooltips under one provider is fine */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="p-2 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                            <Palette size={20} />
                            <span className="sr-only">Switch Theme</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right"><p>Switch Theme</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="p-2 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                            <UserCircle2 size={20} />
                            <span className="sr-only">Account</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right"><p>Account</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            {/* Other Nav items if any */}
        </nav>
    );
}
