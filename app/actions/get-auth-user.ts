import type { SupabaseClient, User } from "@supabase/supabase-js";
import { measureExecutionTime } from "@/lib/performance";

/**
 * Retrieves the currently authenticated user from Supabase.
 *
 * @param client - The Supabase client instance
 * @returns Promise that resolves to the authenticated user object
 * @throws Error if no user is authenticated
 */
export async function getAuthUser(client: SupabaseClient): Promise<User> {
    return measureExecutionTime("getAuthUser", async () => {
        const {
            data: { user },
            error,
        } = await client.auth.getUser();

        if (!user) {
            const errorMessage =
                error?.message || "No user authenticated. Please log in.";
            console.error("Authentication error:", errorMessage);
            throw new Error(errorMessage);
        }

        return user;
    });
}
