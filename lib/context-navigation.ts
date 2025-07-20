import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import { setChatMode, setIsNavigatingToContext } from "@/store/uiSlice";
import { useCallback } from "react";

/**
 * Custom hook for handling context navigation from chat
 * Preserves chat history and search results while switching to thread view
 */
export function useContextNavigation() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const navigateToContext = useCallback(
        async (contextSlug: string) => {
            try {
                // Set loading state
                dispatch(setIsNavigatingToContext(true));

                // Switch to thread mode to show the context
                dispatch(setChatMode(false));

                // Navigate to the context URL
                router.push(`/journal/${contextSlug}`);

                // Note: We don't clear search results or chat history
                // They will be preserved in Redux state
            } catch (error) {
                console.error("Error navigating to context:", error);
            } finally {
                // Reset loading state after a brief delay to account for navigation
                setTimeout(() => {
                    dispatch(setIsNavigatingToContext(false));
                }, 500);
            }
        },
        [router, dispatch]
    );

    return { navigateToContext };
}
