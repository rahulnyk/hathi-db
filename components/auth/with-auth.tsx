import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";

/**
 * Higher Order Component that protects routes requiring authentication
 * @param Component The page component to wrap with authentication protection
 * @returns A new component that includes authentication checks
 */
export function withAuth<P extends { user: User }>(
    Component: React.ComponentType<P>
) {
    return async function AuthProtectedComponent(props: Omit<P, "user">) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
            redirect("/auth/login");
        }

        // Combine the passed props with the user prop
        return <Component {...(props as P)} user={data.user} />;
    };
}
