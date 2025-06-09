"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

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
            className={clsx(
                "rounded-md h-8 w-8",
                // "bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800",
                // "border border-zinc-300 dark:border-zinc-700",
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
