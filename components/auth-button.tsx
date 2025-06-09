import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { cn } from "@/lib/utils";

export async function AuthButton() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    return user ? (
        <div className="flex flex-col items-center justify-center gap-2">
            {/* Hey, {user.email}! */}
            <LogoutButton />
        </div>
    ) : (
        <div className="flex flex-col gap-2">
            <Button
                asChild
                size="sm"
                variant={"ghost"}
                className={cn(
                    "rounded-md h-8 w-8",
                    "cursor-pointer transition-colors duration-200 flex items-center justify-center"
                )}
            >
                <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button
                asChild
                size="sm"
                variant={"ghost"}
                className={cn(
                    "rounded-md h-8 w-8",
                    "cursor-pointer transition-colors duration-200 flex items-center justify-center"
                )}
            >
                <Link href="/auth/sign-up">Sign up</Link>
            </Button>
        </div>
    );
}
