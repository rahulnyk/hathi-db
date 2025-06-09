"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoutButton() {
    const router = useRouter();

    const logout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    return (
        <Button
            onClick={logout}
            className={cn(
                "rounded-md h-8 w-8",
                "cursor-pointer transition-colors duration-200 flex items-center justify-center"
            )}
            title="Logout"
            aria-label="Logout div"
            size={"icon"}
            variant="ghost"
            role="button"
        >
            <LogOutIcon className="h-8 w-8" />
        </Button>
    );
}
