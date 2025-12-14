import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import { setIsNavigatingToContext } from "@/store/uiSlice";
import { useCallback } from "react";

/**
 * Custom hook for handling navigation from chat mode to journal views
 * Preserves chat history and search results while switching to thread view
 * Works for both context navigation and date navigation
 */
export function useContextNavigation() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const navigateToContext = useCallback(
        async (journalRoute: string) => {
            try {
                // Set loading state
                dispatch(setIsNavigatingToContext(true));

                // Navigate to the journal URL (can be context or date)
                router.push(`/journal/${journalRoute}`);

                // Note: We don't clear search results or chat history
                // They will be preserved in Redux state
            } catch (error) {
                console.error("Error navigating to journal:", error);
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
