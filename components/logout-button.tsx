"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoutButton({ isExpanded = false }: { isExpanded?: boolean }) {
    const router = useRouter();

    const logout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    return (
        <Button
            onClick={logout}
            variant="ghost"
            className={cn(
                // Base classes for the expanded state, applied when isExpanded is true
                isExpanded
                    ? "w-full flex items-center justify-start gap-3 text-base py-6 hover:bg-muted" // text-lg to text-base, icon will be h-5 w-5
                    : "h-12 w-12 justify-center flex items-center", // Classes for collapsed state (icon only)
                !isExpanded && "px-0 aspect-square" // Additional collapsed state styling
            )}
            title="Logout"
            aria-label="Logout"
            size={isExpanded ? "default" : "icon"}
        >
            <LogOutIcon className={cn("h-5 w-5", isExpanded && "mr-0")} /> {/* h-6 w-6 to h-5 w-5 */}
            {isExpanded && <span>Logout</span>}
        </Button>
    );
}
